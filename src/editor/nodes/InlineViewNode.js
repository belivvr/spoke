import EditorNodeMixin from "./EditorNodeMixin";
import Image from "../objects/Image";
import spokeLogoSrc from "../../assets/spoke-icon.png";
import { RethrownError } from "../utils/errors";
import { getObjectPerfIssues, maybeAddLargeFileIssue } from "../utils/performance";

export default class InlineViewNode extends EditorNodeMixin(Image) {
  static componentName = "Inline View";

  static nodeName = "Inline View";

  static initialElementProps = {
    src: new URL(spokeLogoSrc, location).href
  };

  static async deserialize(editor, json, loadAsync, onError) {
    const node = await super.deserialize(editor, json);

    const props = json.components.find(c => c.name === "Inline View").props;

    if (json.components.find(c => c.name === "billboard")) {
      node.billboard = true;
    }

    loadAsync(
      (async () => {
        await node.load(props.src, onError);
        node.inlineURL = props.inlineURL;
        node.frameOption = props.frameOption;
        node.contentType = props.contentType || "url";       // 기본값 설정
        node.triggerMode = props.triggerMode || "click";     // 기본값 설정
        node.triggerDistance = props.triggerDistance || 2;   // 기본값 설정
      })()
    );
    
    return node;
  }

  constructor(editor) {
    super(editor);

    this._canonicalUrl = "";
    this.inlineURL = "";
    this.frameOption = "Main";
    this.billboard = false;
    
    // 새로운 속성들 추가
    this.contentType = "url";     // 기본값은 url
    this.triggerMode = "click";   // 기본값은 click
    this.triggerDistance = 2;     // 기본값은 2미터
  }

  get src() {
    return this._canonicalUrl;
  }

  set src(value) {
    this.load(value).catch(console.error);
  }

  onChange() {
    this.onResize();
  }

  loadTexture(src) {
    return this.editor.textureCache.get(src);
  }

  async load(src, onError) {
    const nextSrc = src || "";

    if (nextSrc === this._canonicalUrl && nextSrc !== "") {
      return;
    }

    this._canonicalUrl = nextSrc;

    this.issues = [];
    this._mesh.visible = false;

    this.hideErrorIcon();
    this.showLoadingCube();

    try {
      const { accessibleUrl, meta } = await this.editor.api.resolveMedia(src);

      this.meta = meta;

      this.updateAttribution();

      await super.load(accessibleUrl);
      this.issues = getObjectPerfIssues(this._mesh, false);

      const perfEntries = performance.getEntriesByName(accessibleUrl);

      if (perfEntries.length > 0) {
        const imageSize = perfEntries[0].encodedBodySize;
        maybeAddLargeFileIssue("image", imageSize, this.issues);
      }
    } catch (error) {
      this.showErrorIcon();

      const imageError = new RethrownError(`Error loading image ${this._canonicalUrl}`, error);

      if (onError) {
        onError(this, imageError);
      }

      console.error(imageError);

      this.issues.push({ severity: "error", message: "Error loading image." });
    }

    this.editor.emit("objectsChanged", [this]);
    this.editor.emit("selectionChanged");
    this.hideLoadingCube();

    return this;
  }

  copy(source, recursive = true) {
    super.copy(source, recursive);

    this._canonicalUrl = source._canonicalUrl;
    this.inlineURL = source.inlineURL;
    this.frameOption = source.frameOption;
    this.billboard = source.billboard;
    
    // 새로운 속성들 복사
    this.contentType = source.contentType;
    this.triggerMode = source.triggerMode;
    this.triggerDistance = source.triggerDistance;

    return this;
  }

  serialize() {
    const components = {
      'Inline View': {
        src: this._canonicalUrl,
        inlineURL: this.inlineURL,
        frameOption: this.frameOption,
        contentType: this.contentType,
        triggerMode: this.triggerMode,
        triggerDistance: this.triggerDistance
      }
    };

    if (this.billboard) {
      components.billboard = {};
    }

    return super.serialize(components);
  }

  prepareForExport() {
    super.prepareForExport();
    this.remove(this.helper);

    const convertedFrameOption = this.frameOption === "main"
      ? "main"
      : this.frameOption === "sideView"
      ? "sideView"
      : this.frameOption === "newWindow"
      ? "newWindow"
      : "selfWindow";

    this.addGLTFComponent("inline-frame", {
      name: this.name,
      src: this.inlineURL,
      frameOption: convertedFrameOption,
      imageURL: this.src,
      contentType: this.contentType,
      triggerMode: this.triggerMode,
      triggerDistance: this.triggerDistance
    });

    if (this.billboard) {
      this.addGLTFComponent("billboard", {});
    }

    this.addGLTFComponent("networked", {
      id: this.uuid
    });

    this.replaceObject();
  }

  getRuntimeResourcesForStats() {
    if (this._texture) {
      return { textures: [this._texture], meshes: [this._mesh], materials: [this._mesh.material] };
    }
  }
}

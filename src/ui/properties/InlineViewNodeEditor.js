import React, { useEffect } from "react";
import PropTypes from "prop-types";
import NodeEditor from "./NodeEditor";
import InputGroup from "../inputs/InputGroup";
import BooleanInput from "../inputs/BooleanInput";
import StringInput from "../inputs/StringInput";
import SelectInput from "../inputs/SelectInput";
import ImageInput from "../inputs/ImageInput";
import { WindowRestore } from "styled-icons/fa-solid/WindowRestore";
import useSetPropertySelected from "./useSetPropertySelected";
import NumericInput from "../inputs/NumericInput";

export const options = {
  main: "Main",
  sideView: "Side view",
  selfWindow: "Self window",
  newWindow: "New window"
};

const frameOptions = Object.entries(options).map(([value, label]) => ({ label, value }));


export default function InlineViewNodeEditor(props) {
  const { editor, node } = props;

  const onChangeSrc = useSetPropertySelected(editor, "src");
  const onChangeInlineURL = useSetPropertySelected(editor, "inlineURL");
  const onChangeControls = useSetPropertySelected(editor, "controls");
  const onChangeBillboard = useSetPropertySelected(editor, "billboard");
  const onChangeFrameOption = useSetPropertySelected(editor, "frameOption");
  const onChangeContentType = useSetPropertySelected(editor, "contentType");
  const onChangeTriggerMode = useSetPropertySelected(editor, "triggerMode");
  const onChangeTriggerDistance = useSetPropertySelected(editor, "triggerDistance");

  // .glb 파일 검증
  const validateGLBUrl = (url) => {
    return url.toLowerCase().endsWith('.glb');
  };

  // inlineURL 변경 핸들러
  const handleInlineURLChange = (url) => {
    if (node.contentType === "avatar" && !validateGLBUrl(url)) {
      editor.emit("error", "Avatar URL must be a .glb file");
      return;
    }
    onChangeInlineURL(url);
  };

  // contentType 변경 핸들러
  const handleContentTypeChange = (type) => {
    onChangeContentType(type);
    if (type === "avatar") {
      // avatar 타입으로 변경 시 frameOption을 main으로 강제
      onChangeFrameOption("main");
    }
  };

  return (
    <NodeEditor description={InlineViewNodeEditor.description} {...props}>
      <InputGroup name="Image URL" info="Enter the address of the thumbnail image of the component that will appear in Hubs.">
        <ImageInput value={node.src} onChange={onChangeSrc} />
      </InputGroup>
        <InputGroup name="Content Type">
          <SelectInput 
            options={[
              {label: "URL", value: "url"}, 
              {label: "Avatar", value: "avatar"}
            ]} 
            value={node.contentType} 
            onChange={handleContentTypeChange} 
          />
        </InputGroup>
        <InputGroup name="Inline URL" info={node.contentType === "avatar" ? "Enter the GLB file URL for avatar" : "Enter the inline frame address"}>
          <StringInput 
            value={node.inlineURL} 
            onChange={handleInlineURLChange}
            pattern={node.contentType === "avatar" ? ".*\\.glb$" : undefined}
          />
        </InputGroup>
        <InputGroup
          name="Controls"
          info="Toggle the visibility of the media controls in Hubs. Does not billboard in Spoke."
        >
          <BooleanInput value={node.controls} onChange={onChangeControls} />
        </InputGroup>
        <InputGroup name="Billboard" info="Image always faces user in Hubs.">
          <BooleanInput value={node.billboard} onChange={onChangeBillboard} />
        </InputGroup>
        <InputGroup name="Frame Option">
          <SelectInput 
            options={frameOptions} 
            value={node.frameOption} 
            onChange={onChangeFrameOption}
            disabled={node.contentType === "avatar"}
          />
        </InputGroup>
        <InputGroup name="Trigger Mode">
          <SelectInput 
            options={[
              {label: "Click", value: "click"}, 
              {label: "Proximity", value: "proximity"}
            ]} 
            value={node.triggerMode} 
            onChange={onChangeTriggerMode} 
          />
        </InputGroup>
        {node.triggerMode === "proximity" && (
          <InputGroup name="Trigger Distance" info="Distance in meters">
            <NumericInput 
              value={node.triggerDistance} 
              onChange={onChangeTriggerDistance}
              min={0.1}
              max={10}
              step={0.1}
            />
          </InputGroup>
        )}
    </NodeEditor>
  );
}

InlineViewNodeEditor.propTypes = {
  editor: PropTypes.object,
  node: PropTypes.object,
  multiEdit: PropTypes.bool
};

InlineViewNodeEditor.iconComponent = WindowRestore;

InlineViewNodeEditor.description = `Link to a open another website by iframe`;

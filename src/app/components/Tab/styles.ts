import styled from "styled-components";

// Constants and defaults
import { transparency } from "nersent-ui";

// Mixins
import images from "../../../shared/mixins/images";

interface IStyledTabProps {
  selected: boolean;
  isRemoving: boolean;
}

export const StyledTab = styled.div`
  -webkit-app-region: no-drag;
  position: absolute;
  left: 0;
  top: 0;
  overflow: hidden;
  height: calc(100% - 2px);

  z-index: ${(props: IStyledTabProps) => (props.selected ? 2 : 1)};
  pointer-events: ${props => (props.isRemoving ? "none" : "auto")};
`;

export const Title = styled.div`
  position: absolute;
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  transition: 0.2s opacity;
  font-weight: 500;
  text-transform: uppercase;
  max-width: calc(100% - 64px);

  opacity: ${transparency.light.text.primary};
`;

interface ICloseProps {
  selected: boolean;
}

export const Close = styled.div`
  position: absolute;
  right: 12px;
  height: 16px;
  width: 16px;
  background-image: url(../../src/app/icons/actions/close.svg);
  transition: 0.2s opacity;
  top: 50%;
  transform: translateY(-50%);

  display: ${(props: ICloseProps) => (props.selected ? "block" : "none")};
  opacity: ${transparency.light.icons.inactive};
  ${images.center("100%", "100%")};
`;

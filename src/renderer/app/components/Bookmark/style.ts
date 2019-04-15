import styled, { css } from 'styled-components';

import { centerImage } from '~/shared/mixins';
import { icons } from '../../constants';

export const More = styled.div`
  ${centerImage('20px', '20px')};
  height: 24px;
  width: 24px;
  background-image: url(${icons.more});
  opacity: 0.54;
  filter: invert(100%);

  &:hover {
    opacity: 1;
  }
`;

export const Favicon = styled.div`
  ${centerImage('16px', '16px')};
  height: 16px;
  width: 16px;
  margin-right: 24px;
`;

export const Title = styled.div`
  flex: 3;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  margin-right: 16px;

  &:hover {
    cursor: pointer;
    text-decoration: underline;
  }
`;

export const Site = styled.div`
  flex: 2;
  opacity: 0.54;
`;

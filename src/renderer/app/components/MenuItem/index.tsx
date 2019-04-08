import * as React from 'react';
import { StyledMenuItem, Title, Icon } from './style';

export const MenuItem = ({ children, icon, invert, light, maxLines }: any) => {
  return (
    <StyledMenuItem>
      <Icon
        invert={invert}
        light={light}
        style={{ backgroundImage: `url(${icon})` }}
      />
      <Title
        style={{
          WebkitLineClamp: maxLines,
        }}
      >
        {children}
      </Title>
    </StyledMenuItem>
  );
};

MenuItem.defaultProps = {
  maxLines: 2,
};

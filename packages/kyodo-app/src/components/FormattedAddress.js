import React from 'react';
import styled from 'styled-components';

const GRAY = 'rgba(0, 0, 0, 0.2)';

const StyledAddress = styled.div`
  font-family: Roboto Mono;
  font-size: 16px;
  font-style: normal;
  font-weight: normal;

  text-overflow: ellipsis;
  overflow: hidden;
  flex-grow: 1;
  text-align: right;
`;

const GrayTextSpan = styled.span`
  color: ${GRAY};
`;

const FormattedAddress = ({ children: value = '', className }) => (
  <StyledAddress className={className}>
    {value.slice(0, 6)}
    <GrayTextSpan>{value.slice(6, -4)}</GrayTextSpan>
    {value.slice(-4)}
  </StyledAddress>
);

export default FormattedAddress;

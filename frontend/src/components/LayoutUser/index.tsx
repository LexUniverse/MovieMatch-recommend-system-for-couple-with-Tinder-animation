import React from "react";

import LayoutDefault from "components/LayoutDefault";


interface IProps {}

const LayoutUser: React.FC<IProps> = (props) => {
  return (
    <LayoutDefault>
      <div>
        <div>
          <div>{props.children}</div>
        </div>
      </div>
    </LayoutDefault>
  );
};

export default LayoutUser;

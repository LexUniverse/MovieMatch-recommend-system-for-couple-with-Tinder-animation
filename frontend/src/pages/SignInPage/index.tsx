import React from "react";

import VKButton from "components/VKButton";
import LayoutDefault from "components/LayoutDefault";


const SignInPage: React.FC = () => {
  return (
      <LayoutDefault>
          <div className="container">
              <div className="centered">
                  <VKButton/>
              </div>
          </div>
      </LayoutDefault>
);
};

export default SignInPage;

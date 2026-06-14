import React from "react";
import { Composition, registerRoot } from "remotion";
import { CodraDemo } from "./video";

export const RemotionRoot = () => {
  return (
    <>
      <Composition id="CodraDemo" component={CodraDemo} durationInFrames={48 * 30} fps={30} width={1920} height={1080} />
    </>
  );
};

registerRoot(RemotionRoot);

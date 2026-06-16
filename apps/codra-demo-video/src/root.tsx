import React from "react";
import { Composition, registerRoot } from "remotion";
import { CodraHarnessDemo } from "./video";

export const RemotionRoot = () => {
  return (
    <>
      <Composition id="CodraHarnessDemo" component={CodraHarnessDemo} durationInFrames={54 * 6} fps={6} width={1920} height={1080} />
    </>
  );
};

registerRoot(RemotionRoot);

import React from 'react';
import { Composition } from 'remotion';
import { CodraLaunchVideo } from './CodraLaunchVideo';

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="CodraLaunchVideo"
        component={CodraLaunchVideo}
        durationInFrames={1800}
        fps={30}
        width={1920}
        height={1080}
      />
    </>
  );
};

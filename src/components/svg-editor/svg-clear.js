import SVGO from 'svgo';

async function prepareForLaser(svgString) {
  const svgo = new SVGO({
    plugins: [
      'cleanupEnableBackground',
      'removeHiddenElems',
      'removeHiddenPaths',
      'convertStyleToAttrs',
      'convertPathData',
      'convertTransform',
      'removeUselessDefs',
      'cleanupEnableBackground',
      'removeHiddenElems',
      'removeHiddenPaths',
      'convertStyleToAttrs',
      { convertPathData: { precision: 2 } },
    ],
  });

  const { data } = await svgo.optimize(svgString);
  return data;
}

const rawSvg = svgEditElement.innerHTML;
const cleanSvg = await prepareForLaser(rawSvg);

downloadFile(cleanSvg, 'design.svg');
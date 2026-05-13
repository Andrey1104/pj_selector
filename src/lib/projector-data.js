const PARAMS = {
  defaults: {
    floor_material: 0,
    symbol: 0,
    optics: 5,
    projector: 6,
    floor_color: 'rgb(75%, 75%, 75%)',
    spot_illuminance_lx: 450,
    projection_height_cm: 900,
  },
  floor_material: [
    { label: 'Linoleum', scale: 2.0, filename: 'scuffed-plastic' },
    { label: 'Concrete', scale: 2.0, filename: 'polished-concrete' },
    { label: 'Carpet', scale: 0.25, filename: 'carpet1' },
  ],
  symbol: [
    { label: 'T0419-2', filename: 'T0419-2.png' },
    { label: 'F0818-2c', filename: 'F0818-2c.png' },
    { label: 'CH', filename: 'ch.png' },
    { label: 'KL', filename: 'kl.png' },
    { label: 'PR', filename: 'pr.png' },
  ],
  optics: [
    { label: '4°', angle_deg: 4.0 },
    { label: '10°', angle_deg: 10.0 },
    { label: '13°', angle_deg: 13.0 },
    { label: '15°', angle_deg: 15.0 },
    { label: '20°', angle_deg: 20.0 },
    { label: '25°', angle_deg: 25.0 },
    { label: '30°', angle_deg: 30.0 },
    { label: '45°', angle_deg: 45.0 },
  ],
  projector: [
    { label: '10 W', flux_lm: 2000.0 },
    { label: '21/25 W', flux_lm: 4000.0 },
    { label: '30 W', flux_lm: 3500.0 },
    { label: '70 W', flux_lm: 10000.0 },
    { label: '100 W', flux_lm: 15000.0 },
    { label: '200 W', flux_lm: 20000.0 },
    { label: '300 W', flux_lm: 30000.0 },
  ],
};

export default PARAMS;
export const ASSET_BASE = '/projection-assets';

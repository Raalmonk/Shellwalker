import WU from '../assets/abilityIcons/ability_monk_hurricanestrike.jpg';
import RSK from '../assets/abilityIcons/ability_monk_risingsunkick.jpg';
import BOK from '../assets/abilityIcons/ability_monk_roundhousekick.jpg';
import Xuen from '../assets/abilityIcons/ability_monk_summontigerstatue.jpg';
import SW from '../assets/abilityIcons/ability_skyreach_wind_wall.jpg';
import CC from '../assets/abilityIcons/inv_ability_conduitofthecelestialsmonk_celestialconduit.jpg';
import AA from '../assets/abilityIcons/inv_hand_1h_artifactskywall_d_01.jpg';
import SEF from '../assets/abilityIcons/spell_nature_giftofthewild.jpg';
import FoF from '../assets/abilityIcons/monk_ability_fistoffury.jpg';

export const ABILITY_ICON_MAP: Record<string, {src: string; abbr: string}> = {
  WU:  {src: WU,  abbr: 'WU'},
  RSK: {src: RSK, abbr: 'RSK'},
  BOK: {src: BOK, abbr: 'BOK'},
  Xuen:{src: Xuen,abbr: 'Xuen'},
  SW:  {src: SW,  abbr: 'SW'},
  CC:  {src: CC,  abbr:'CC'},
  AA:  {src: AA,  abbr:'AA'},
  SEF: {src: SEF, abbr: 'SEF'},
  FoF: {src: FoF, abbr: 'FoF'},
};

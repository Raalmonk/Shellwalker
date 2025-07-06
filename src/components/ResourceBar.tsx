export const ResourceBar = ({ energy, chi }:{
  energy:number; chi:number
}) => (
  <div className="flex gap-4 items-center">
    <div className="w-56 bg-gray-300">
      <div style={{width:`${energy}%`}} className="h-3 bg-yellow-500" />
    </div>
    <span>Energy {energy}</span>
    <div className="w-32 bg-gray-300">
      <div style={{width:`${(chi/6)*100}%`}} className="h-3 bg-green-500" />
    </div>
    <span>Chi {chi}</span>
  </div>
);

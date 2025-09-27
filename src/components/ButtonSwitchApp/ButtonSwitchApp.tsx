import './ButtonSwitchApp.css'

type ButtonSwitchAppProps = {
  value: boolean;
  onChange?: (checked: boolean) => void;
};

export default function ButtonSwitchApp({ value, onChange }: ButtonSwitchAppProps) {
  return (
    <div className="toggle-cont">
      <input 
        className="toggle-input" 
        checked={value} 
        id="toggle" 
        name="toggle" 
        type="checkbox" 
        onChange={e => onChange && onChange(e.target.checked)} 
      />
      <label className="toggle-label" htmlFor="toggle">
        <div className="cont-label-play">
          <span className="label-play" />
        </div>
      </label>
    </div>
  )
}
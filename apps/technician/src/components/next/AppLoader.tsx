type AppLoaderProps = {
  label?: string;
};

export function AppLoader({ label = "Loading" }: AppLoaderProps) {
  return (
    <div className="looplic-loader" role="status" aria-live="polite" aria-label={label}>
      <div className="looplic-loader__mark">
        <span className="looplic-loader__ring" />
        <img src="/favicon.ico" alt="" className="looplic-loader__icon" />
      </div>
      <div className="looplic-loader__copy">
        <span>{label}</span>
        <i />
      </div>
    </div>
  );
}

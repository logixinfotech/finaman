import { useFontScale, MIN, MAX, DEFAULT } from "../theme/FontScaleContext";

export default function FontSizeControl() {
  const { fontScale, setFontScale } = useFontScale();

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={() => setFontScale(fontScale - 5)}
        disabled={fontScale <= MIN}
        className="px-2 py-1 border rounded disabled:opacity-40"
        title="Decrease text size"
      >
        A-
      </button>

      <input
        type="range"
        min={MIN}
        max={MAX}
        step={5}
        value={fontScale}
        onChange={(e) => setFontScale(e.target.value)}
        className="w-28"
      />

      <button
        type="button"
        onClick={() => setFontScale(fontScale + 5)}
        disabled={fontScale >= MAX}
        className="px-2 py-1 border rounded disabled:opacity-40"
        title="Increase text size"
      >
        A+
      </button>

      <span className="text-xs w-10 text-center">{fontScale}%</span>

      <button
        type="button"
        onClick={() => setFontScale(DEFAULT)}
        className="px-2 py-1 border rounded text-xs"
      >
        Reset
      </button>
    </div>
  );
}
// StatusNotifierItem pixmaps use network-order ARGB bytes.
export function isBlank(pixmaps) {
    if (!pixmaps.length)
        return false;
    return pixmaps.every(([w, h, data]) => {
        if (w <= 0 || h <= 0 || data.length !== w * h * 4)
            return false;
        for (let i = 0; i < data.length; i += 4) {
            if (data[i] !== 0)
                return false;
        }
        return true;
    });
}

export function withDot(pixmaps) {
    return pixmaps.map(([w, h, source]) => {
        const data = Array.from(source);
        const cx = w * 0.32;
        const cy = h * 0.68;
        const radius = Math.min(w, h) * 0.31;
        for (let y = 0; y < h; y++) {
            for (let x = 0; x < w; x++) {
                const coverage = Math.max(0, Math.min(1,
                    radius + 0.5 - Math.hypot(x + 0.5 - cx, y + 0.5 - cy)));
                if (!coverage)
                    continue;
                const i = (y * w + x) * 4;
                const a = data[i] / 255;
                const outAlpha = coverage + a * (1 - coverage);
                data[i] = Math.round(outAlpha * 255);
                [59, 130, 246].forEach((color, channel) => {
                    data[i + channel + 1] = Math.round(
                        (color * coverage + data[i + channel + 1] * a * (1 - coverage)) / outAlpha);
                });
            }
        }
        return [w, h, data];
    });
}

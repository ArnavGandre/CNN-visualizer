export function Layer({ data, label, shape, isLast }) {
  if (!data || data.length === 0) return null;
  if(isLast){
        const cols = shape && shape.length === 4 ? shape[2] : Math.ceil(Math.sqrt(data.length));
const pixelSize = 8;
        return (
        <div style={{ width: cols * pixelSize, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 9 }}>
          <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 50 }}>{label}</p>
          <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center' }}>
            {data.map((value, i) => (
              <div
                key={i}
                style={{
                  width: 20,
                  height: 20,
                  backgroundColor: `rgb(${Math.round(value * 255)}, 0, 0)`,
                  opacity: Math.max(value, 0.08),
                }}
              ><p className="label">{i}</p></div>
            ))}
          </div>
        </div>
      );


  }else{
    const cols = shape && shape.length === 4 ? shape[2] : Math.ceil(Math.sqrt(data.length));
const pixelSize = 8;
      return (
        <div style={{ width: cols * pixelSize, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
          <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11 }}>{label}</p>
          <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center' }}>
            {data.map((value, i) => (
              <div
                key={i}
                style={{
                  width: 8,
                  height: 8,
                  backgroundColor: `rgb(${Math.round(value * 255)}, 0, 0)`,
                  opacity: Math.max(value, 0.08),
                }}
              />
            ))}
          </div>
        </div>
      );

  }
}
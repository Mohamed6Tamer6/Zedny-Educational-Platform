import React from 'react';

/**
 * SkillsGraph Component
 * Renders a premium SVG-based Radar Chart for course skills.
 * 
 * @param {Array} skills - Array of { name, level } objects (0-100 scale)
 * @param {number} size - Chart size in pixels
 */
export default function SkillsGraph({ skills = [], size = 300 }) {
    if (!skills || skills.length < 3) {
        return (
            <div className="skills-fallback">
                {skills && skills.length > 0 ? (
                    <div className="skills-tag-grid">
                        {skills.map((s, i) => (
                            <div key={i} className="skill-tag-premium">
                                <span className="skill-name">{s.name}</span>
                                <div className="skill-bar-bg">
                                    <div className="skill-bar-fill" style={{ width: `${s.level}%` }}></div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <p>No skill data available</p>
                )}
            </div>
        );
    }

    const padding = 85;
    const center = size / 2;
    const radius = (size / 2) - padding;
    const count = skills.length;
    const angleStep = (Math.PI * 2) / count;

    // Helper to calculate coordinates
    const getCoords = (angle, mag) => {
        const x = center + Math.cos(angle - Math.PI / 2) * (radius * mag);
        const y = center + Math.sin(angle - Math.PI / 2) * (radius * mag);
        return { x, y };
    };

    // Background shapes (circles/polygons)
    const bgLayers = [0.2, 0.4, 0.6, 0.8, 1.0];

    // Skill data path
    const dataPoints = skills.map((s, i) => {
        const mag = Math.max(0.1, s.level / 100);
        return getCoords(i * angleStep, mag);
    });

    const dataPath = dataPoints.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ') + ' Z';

    const extraWidth = 100; // Extra space for labels on each side

    return (
        <div className="skills-graph-container">
            <svg
                width={size + (extraWidth * 2)}
                height={size}
                viewBox={`-${extraWidth} 0 ${size + (extraWidth * 2)} ${size}`}
                style={{ overflow: 'visible' }}
            >
                {/* Background Grid */}
                {bgLayers.map((mag, idx) => (
                    <polygon
                        key={idx}
                        points={Array.from({ length: count }).map((_, i) => {
                            const p = getCoords(i * angleStep, mag);
                            return `${p.x},${p.y}`;
                        }).join(' ')}
                        fill="none"
                        stroke="rgba(255, 255, 255, 0.05)"
                        strokeWidth="1"
                    />
                ))}

                {/* Axes */}
                {Array.from({ length: count }).map((_, i) => {
                    const p = getCoords(i * angleStep, 1);
                    return (
                        <line
                            key={i}
                            x1={center}
                            y1={center}
                            x2={p.x}
                            y2={p.y}
                            stroke="rgba(255, 255, 255, 0.1)"
                        />
                    );
                })}

                {/* Data Area */}
                <path
                    d={dataPath}
                    fill="url(#skillGradient)"
                    stroke="#3b82f6"
                    strokeWidth="2"
                    className="skill-path-animate"
                />

                {/* Data Points */}
                {dataPoints.map((p, i) => (
                    <circle key={i} cx={p.x} cy={p.y} r="4" fill="#60a5fa" />
                ))}

                {/* Labels */}
                {skills.map((s, i) => {
                    const angle = i * angleStep;
                    const p = getCoords(angle, 1.15); // Reduced factor slightly because we increased padding

                    // Improved alignment logic
                    const xOffset = Math.cos(angle - Math.PI / 2);
                    let anchor = 'middle';
                    if (xOffset > 0.2) anchor = 'start';
                    else if (xOffset < -0.2) anchor = 'end';

                    const yOffset = Math.sin(angle - Math.PI / 2);
                    let baseline = 'middle';
                    if (yOffset > 0.8) baseline = 'hanging'; // Bottom
                    else if (yOffset < -0.8) baseline = 'auto'; // Top

                    return (
                        <text
                            key={i}
                            x={p.x}
                            y={p.y}
                            textAnchor={anchor}
                            dominantBaseline={baseline}
                            fill="rgba(255, 255, 255, 0.8)"
                            fontSize="11"
                            fontWeight="600"
                            className="skill-label"
                        >
                            {s.name}
                        </text>
                    );
                })}

                <defs>
                    <linearGradient id="skillGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="rgba(59, 130, 246, 0.5)" />
                        <stop offset="100%" stopColor="rgba(139, 92, 246, 0.5)" />
                    </linearGradient>
                </defs>
            </svg>

            <style jsx>{`
                .skills-graph-container {
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    padding: 20px;
                }

                .skill-path-animate {
                    filter: drop-shadow(0 0 8px rgba(59, 130, 246, 0.4));
                    animation: dash 2s ease-out;
                }

                @keyframes dash {
                    from { opacity: 0; transform: scale(0.5); }
                    to { opacity: 1; transform: scale(1); }
                }

                .skill-label {
                    text-transform: uppercase;
                    letter-spacing: 0.5px;
                }

                .skill-tag-premium {
                    background: rgba(255, 255, 255, 0.03);
                    border: 1px solid rgba(255, 255, 255, 0.05);
                    border-radius: 12px;
                    padding: 12px 16px;
                    display: flex;
                    flex-direction: column;
                    gap: 8px;
                }

                .skill-name {
                    font-size: 0.85rem;
                    font-weight: 600;
                    color: rgba(255, 255, 255, 0.9);
                    text-transform: capitalize;
                }

                .skill-bar-bg {
                    height: 4px;
                    background: rgba(255, 255, 255, 0.05);
                    border-radius: 2px;
                    overflow: hidden;
                }

                .skill-bar-fill {
                    height: 100%;
                    background: linear-gradient(90deg, #3b82f6, #8b5cf6);
                    border-radius: 2px;
                }

                .skills-tag-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
                    gap: 12px;
                    width: 100%;
                }
            `}</style>
        </div>
    );
}

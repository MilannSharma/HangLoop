import React, { useEffect, useRef } from 'react';

/**
 * Renders the 3D poem animation hero section.
 * 
 * This component creates a cinematic 3D rotating text cube with
 * perspective grid floor, ambient hue cycling, background imagery,
 * and character silhouette overlay.
 * 
 * @param poemHTML - The HTML content to display on the cube faces (moving text)
 * @param backgroundImageUrl - URL for the immersive background scene image
 * @param boyImageUrl - URL for the character silhouette overlay
 */
export const PoemAnimation = ({ poemHTML, backgroundImageUrl, boyImageUrl }: {
    poemHTML: string;
    backgroundImageUrl: string;
    boyImageUrl: string;
}) => {
    const contentRef = useRef<HTMLDivElement>(null);

    // This effect handles the responsive scaling of the animation container.
    useEffect(() => {
        function adjustContentSize() {
            if (contentRef.current) {
                const viewportWidth = window.innerWidth;
                const baseWidth = 1000;
                const scaleFactor = viewportWidth < baseWidth ? (viewportWidth / baseWidth) * 0.9 : 1;
                contentRef.current.style.transform = `scale(${scaleFactor})`;
            }
        }

        adjustContentSize();
        window.addEventListener("resize", adjustContentSize);
        return () => window.removeEventListener("resize", adjustContentSize);
    }, []);

    return (
        <header className="hero-section">
            <div className="animation-container">
                <div
                    ref={contentRef}
                    className="content"
                    style={{ display: 'block', width: '1000px', height: '562px' }}
                >
                    <div className="container-full">
                        {/* Ambient Hue Animation */}
                        <div className="animated hue"></div>

                        {/* Immersive Background Scene */}
                        <img
                            className="backgroundImage"
                            src={backgroundImageUrl}
                            alt="Immersive concert stage atmosphere"
                            onError={(e) => (e.target as HTMLImageElement).style.display = 'none'}
                        />

                        {/* Character Silhouette Overlay */}
                        <img
                            className="boyImage"
                            src={boyImageUrl}
                            alt="Music performer silhouette"
                            onError={(e) => (e.target as HTMLImageElement).style.display = 'none'}
                        />

                        {/* 3D Perspective Grid Floor */}
                        <div className="stage-grid-floor"></div>

                        {/* Neon Horizon Glow Line */}
                        <div className="stage-horizon-glow"></div>

                        {/* 3D Moving Text Cube */}
                        <div className="cube-container">
                            <div className="cube">
                                <div className="face top"></div>
                                <div className="face bottom"></div>
                                <div className="face left text" dangerouslySetInnerHTML={{ __html: poemHTML }}></div>
                                <div className="face right text" dangerouslySetInnerHTML={{ __html: poemHTML }}></div>
                                <div className="face front"></div>
                                <div className="face back text" dangerouslySetInnerHTML={{ __html: poemHTML }}></div>
                            </div>
                        </div>

                        {/* 3D Cube Mirror Reflection */}
                        <div className="container-reflect">
                            <div className="cube">
                                <div className="face top"></div>
                                <div className="face bottom"></div>
                                <div className="face left text" dangerouslySetInnerHTML={{ __html: poemHTML }}></div>
                                <div className="face right text" dangerouslySetInnerHTML={{ __html: poemHTML }}></div>
                                <div className="face front"></div>
                                <div className="face back text" dangerouslySetInnerHTML={{ __html: poemHTML }}></div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </header>
    );
};

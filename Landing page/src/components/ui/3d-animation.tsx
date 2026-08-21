import React, { useEffect, useRef } from 'react';

export interface PoemAnimationProps {
    poemHTML: string;
    backgroundImageUrl: string;
    boyImageUrl: string;
}

/**
 * Renders the 3D poem animation hero section.
 */
export const PoemAnimation: React.FC<PoemAnimationProps> = ({ poemHTML, backgroundImageUrl, boyImageUrl }) => {
    const contentRef = useRef<HTMLDivElement>(null);

    return (
        <header className="hero-section">
            <div className="hero-3d-stage-wrapper">
                <div 
                    ref={contentRef} 
                    className="content"
                >
                    <div className="container-full">
                        <div className="animated hue"></div>
                        <img 
                            className="backgroundImage" 
                            src={backgroundImageUrl} 
                            alt="An old stone courtyard at dawn" 
                            onError={(e) => (e.target as HTMLImageElement).style.display = 'none'} 
                        />
                        <img 
                            className="boyImage" 
                            src={boyImageUrl} 
                            alt="A man and woman practicing with swords" 
                            onError={(e) => (e.target as HTMLImageElement).style.display = 'none'} 
                        />
                        
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

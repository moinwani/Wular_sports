import React, { memo } from 'react';

export const About = memo(() => (
    <section id="about">
        <div className="container">
            <h2 className="section-title">About Wular Sports</h2>
            <p>Wular Sports is committed to crafting high-performance cricket bats for every game – whether you're playing with a leather ball or smashing shots with a tennis ball. Proudly made in Kashmir, our bats are a symbol of quality and power, designed for champions.</p>
            <div className="location-box">
                <i className="fas fa-map-marker-alt" aria-hidden="true"></i>
                <span>Srinagar, Jammu and Kashmir, India</span>
            </div>
        </div>
    </section>
));

const fs = require('fs');

const userConfig = {
    "colors": {
        "on-background": "#e4e1ed",
        "outline": "#908fa0",
        "surface-container": "#1f1f27",
        "on-tertiary-fixed-variant": "#005048",
        "surface-container-high": "#292932",
        "secondary": "#ffb0cd",
        "surface-container-highest": "#34343d",
        "primary-fixed-dim": "#c0c1ff",
        "surface-variant": "#34343d",
        "secondary-container": "#aa0266",
        "on-error-container": "#ffdad6",
        "on-primary": "#1000a9",
        "outline-variant": "#464554",
        "on-secondary-fixed-variant": "#8c0053",
        "on-secondary-container": "#ffbad3",
        "on-tertiary-container": "#00302a",
        "surface-bright": "#393841",
        "tertiary-fixed": "#71f8e4",
        "on-tertiary-fixed": "#00201c",
        "on-secondary-fixed": "#3e0022",
        "on-primary-fixed-variant": "#2f2ebe",
        "background": "#13131b",
        "secondary-fixed": "#ffd9e4",
        "surface-container-lowest": "#0d0d15",
        "on-tertiary": "#003731",
        "error-container": "#93000a",
        "tertiary-fixed-dim": "#4fdbc8",
        "surface-container-low": "#1b1b23",
        "inverse-surface": "#e4e1ed",
        "primary-container": "#8083ff",
        "primary": "#c0c1ff",
        "on-surface": "#e4e1ed",
        "secondary-fixed-dim": "#ffb0cd",
        "tertiary-container": "#00a392",
        "primary-fixed": "#e1e0ff",
        "surface-dim": "#13131b",
        "inverse-primary": "#494bd6",
        "on-primary-container": "#0d0096",
        "on-surface-variant": "#c7c4d7",
        "error": "#ffb4ab",
        "on-error": "#690005",
        "on-secondary": "#640039",
        "surface-tint": "#c0c1ff",
        "inverse-on-surface": "#303038",
        "surface": "#13131b",
        "on-primary-fixed": "#07006c",
        "tertiary": "#4fdbc8"
    },
    "borderRadius": {
        "DEFAULT": "1rem",
        "lg": "2rem",
        "xl": "3rem",
        "full": "9999px"
    },
    "spacing": {
        "container-max": "1440px",
        "grid-gap": "24px",
        "bento-unit": "160px",
        "section-padding": "48px"
    },
    "fontFamily": {
        "display-lg": ["Syne"],
        "headline-xl": ["Syne"],
        "body-lg": ["DM Sans"],
        "headline-xl-mobile": ["Syne"],
        "body-md": ["DM Sans"],
        "label-caps": ["Space Mono"],
        "headline-md": ["Syne"]
    },
    "fontSize": {
        "display-lg": ["72px", { "lineHeight": "1.1", "letterSpacing": "-0.04em", "fontWeight": "800" }],
        "headline-xl": ["48px", { "lineHeight": "1.2", "letterSpacing": "-0.02em", "fontWeight": "700" }],
        "body-lg": ["18px", { "lineHeight": "1.6", "fontWeight": "400" }],
        "headline-xl-mobile": ["32px", { "lineHeight": "1.2", "fontWeight": "700" }],
        "body-md": ["16px", { "lineHeight": "1.6", "fontWeight": "400" }],
        "label-caps": ["12px", { "lineHeight": "1", "letterSpacing": "0.1em", "fontWeight": "700" }],
        "headline-md": ["24px", { "lineHeight": "1.4", "fontWeight": "600" }]
    }
};

let content = fs.readFileSync('tailwind.config.js', 'utf8');

const newExtendContent = `
      colors: ${JSON.stringify(userConfig.colors, null, 8).replace(/}$/, '      },')}
      borderRadius: ${JSON.stringify(userConfig.borderRadius, null, 8).replace(/}$/, '      },')}
      spacing: ${JSON.stringify(userConfig.spacing, null, 8).replace(/}$/, '      },')}
      fontFamily: ${JSON.stringify(userConfig.fontFamily, null, 8).replace(/}$/, '      },')}
      fontSize: ${JSON.stringify(userConfig.fontSize, null, 8).replace(/}$/, '      },')}
`;

content = content.replace(/colors:\s*\{[\s\S]*?(?=animation:)/, newExtendContent);
fs.writeFileSync('tailwind.config.js', content);
console.log('Updated tailwind.config.js');

import {
    fonts as sharedFonts,
    fontLabels
} from './2p-simple.js';
import {
    plainDocument,
    validateDocument
} from '../js/RichText.js';
import {
    createRichTextBlock
} from '../js/RichTextCanvas.js';

export const templateId = 'main-tweet';
export const author = '@baegop157902';
export const size = {
    width: 1920,
    height: 1080
};
export const fonts = ['Apple SD Gothic Neo', ...sharedFonts.filter(font => font !== 'Apple SD Gothic Neo')];
export const tabs = [{
    id: 'maintweet',
    label: '메인트',
    heading: '메인트'
}];
export const groups = [
    ['Back', '배경'],
    ['image', '이미지'],
    ['info', '정보'],
    ['Character-info', '캐성향'],
    ['Owner-info', '오너성향']
];
export const formOptions = {
    desktopCategories: true,
    panelClass: 'main-tweet-editor',
    preservePanelPosition: true
};
export const positions = {
    'maintweet-main-image': {
        x: 1300,
        y: 0,
        width: 620,
        height: 1080
    }
};
export function fields(side, group) {
    if (side !== 'maintweet') return [];
    const f = (key, label, type = 'text', extra = {}) => ({
        id: `maintweet-${key}`,
        label,
        type,
        ...extra
    });
    switch (group) {
        case 'Back':
            return [f('back-radio', '배경', 'radio', {
                options: [{
                    value: 'light',
                    label: '라이트'
                }, {
                    value: 'dark',
                    label: '다크'
                }, {
                    value: 'solid',
                    label: '단색'
                }]
            }), f('back-color', '배경색', 'color', {
                visibleWhen: {
                    id: 'maintweet-back-radio',
                    value: 'solid'
                }
            })];
        case 'info':
            return [f('korea-name', '이름(한글)'), f('korea-age', '나이'), f('korea-color', '이름 색상', 'color'),
                f('sub-name', '이름(영문/한자)'), f('sub-font', '영문명 폰트', 'font'), f('sub-color', '영문명 색상', 'color'), f('catchphrase', '캐프'), f('catchphrase-font', '캐프 폰트', 'font'),
                f('catchphrase-color', '캐프 컬러', 'color'), f('keyword', '키워드'), f('keyword-color', '키워드 색', 'color')
            ];
        case 'Character-info':
            return [f('character', '캐성향', 'richtext')];
        case 'Owner-info':
            return [f('owner', '오너성향', 'richtext')];
        default:
            return [];
    }
}
export function imageField(side, group) {
    return side === 'maintweet' && group === 'image' ? {
        id: 'maintweet-main-image',
        ...positions['maintweet-main-image']
    } : null;
}
export function initialState(id = templateId) {
    const defaults = {
        'back-radio': 'light',
        'back-color': '#f3f3f3',
        'korea-name': '이름',
        'korea-age': '나이',
        'korea-color': '#363636',
        'sub-name': 'NAME',
        'sub-font': 'Apple SD Gothic Neo',
        'sub-color': '#363636',
        'catchphrase': '캐치프라이즈',
        'catchphrase-font': 'Apple SD Gothic Neo',
        'catchphrase-color': '#363636',
        'keyword': '#키워드 #키워드 #키워드',
        'keyword-color': '#6d6d6d',
        'character': '- 캐릭터 성향을 적어주세요.',
        'owner': '- 오너 성향을 적어주세요.',
        'main-image-citation': ''
    };
    const values = Object.fromEntries(Object.entries(defaults).map(([key, value]) => [`maintweet-${key}`, value]));
    const richText = Object.fromEntries(['character', 'owner'].map(key => [`maintweet-${key}`, plainDocument(values[`maintweet-${key}`])]));
    return {
        schemaVersion: 1,
        templateId: id,
        values,
        touched: {},
        images: {},
        stickers: [],
        richText
    };
}
export function restoreFormatting(raw, next) {
    for (const key of ['maintweet-character', 'maintweet-owner']) next.richText[key] = raw.richText?.[key] ?
        validateDocument(raw.richText[key], next.values[key]) : plainDocument(next.values[key]);
}
export function createScene(stage, openEditor, store) {
    const K = window.Konva,
        layer = new K.Layer();
    stage.add(layer);
    let state = store.state,
        values = state.values;
    const bg = new K.Rect({
            ...size,
            fill: '#FBFBFB'
        }),
        theme = new K.Image({
            ...size,
            listening: false
        });
    layer.add(bg, theme);
    const mainBox = new K.Rect({
        ...positions['maintweet-main-image'],
        fill: '#434343'
    });
    const main = new K.Image({
        ...positions['maintweet-main-image'],
        listening: false
    });
    layer.add(mainBox, main);
    const info = new K.Rect({
        x: 45,
        y: 196,
        width: 1279,
        height: 846,
        cornerRadius: 10,
        fill: '#ffffff',
        opacity: 0.7,
        shadowColor: '#000000',
        shadowOpacity: 0.25,
        shadowBlur: 10,
        shadowOffset: {x: 0, y: 0}
    });
    layer.add(info);

    function click(node, category) {
        node.on('click tap', e => {
            e.cancelBubble = true;
            openEditor('maintweet', category, node);
        });
        node.on('mouseenter', () => stage.container().style.cursor = 'pointer');
        node.on('mouseleave', () => stage.container().style.cursor = '');
    }
    click(bg, 'Back');
    click(mainBox, 'image');
    click(info, 'Character-info');
    const bindings = [];

    function text(attrs, key, color, font) {
        const fontSize = attrs.fontSize || 24,
            node = new K.Text({
                fontFamily: 'Apple SD Gothic Neo',
                fontSize,
                fontStyle: '400',
                letterSpacing: fontSize * -0.025,
                align: 'left',
                verticalAlign: 'middle',
                fill: '#363636',
                ...attrs
            });
        layer.add(node);
        if (key) bindings.push({
            node,
            key: `maintweet-${key}`,
            color: color && `maintweet-${color}`,
            font: font && `maintweet-${font}`
        });
        return node;
    }
    const ko = text({
        x: 45,
        y: 43,
        fontSize: 36
    }, 'korea-name', 'korea-color');
    const dot = text({
        x: 45,
        y: 43,
        fontSize: 36,
        text: '·'
    });
    const age = text({
        x: 45,
        y: 43,
        fontSize: 36
    }, 'korea-age', 'korea-color');
    const sub = text({
        x: 45,
        y: 85,
        height: 106,
        fontSize: 96
    }, 'sub-name', 'sub-color', 'sub-font');
    const catchphrase = text({
        x: 373,
        y: 47,
        width: 951,
        height: 84,
        fontSize: 64,
        align: 'right',
        wrap: 'none'
    }, 'catchphrase', 'catchphrase-color', 'catchphrase-font');
    const keyword = text({
        x: 373,
        y: 138,
        width: 951,
        fontSize: 24,
        align: 'right'
    }, 'keyword', 'keyword-color');
    for (const node of [ko, dot, age, sub, catchphrase, keyword]) click(node, 'info');
    const heading1 = text({
        x: 101,
        y: 237,
        fontSize: 32,
        fill: '#202020',
        text: 'Character'
    });
    click(heading1, 'Character-info');
    const character = createRichTextBlock(K, layer, {
        x: 101,
        y: 293,
        width: 1170,
        height: 290
    });
    layer.add(new K.Line({
        points: [101, 619, 153, 619],
        stroke: '#202020',
        strokeWidth: 1,
        listening: false
    }));
    const heading2 = text({
        x: 101,
        y: 660,
        fontSize: 32,
        fill: '#202020',
        text: 'Owner'
    });
    click(heading2, 'Owner-info');
    const owner = createRichTextBlock(K, layer, {
        x: 101,
        y: 716,
        width: 1170,
        height: 290
    });
    for (const [category, y] of [
            ['Character-info', 293],
            ['Owner-info', 716]
        ]) {
        const hit = new K.Rect({
            x: 101,
            y,
            width: 1170,
            height: 290,
            fill: 'rgba(0,0,0,0)'
        });
        layer.add(hit);
        click(hit, category);
    }
    const citation = text({
        x: 1330,
        y: 1050,
        width: 560,
        fontSize: 14,
        align: 'center',
        fill: '#5f5f5f',
        stroke: '#ffffff',
        strokeWidth: 2,
        fillAfterStrokeEnabled: true,
        listening: false
    });
    const themes = {};
    const ready = Promise.all([
        ['light', 'theme-1.png'],
        ['dark', 'theme-2.png']
    ].map(([key, file]) => new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => {
            themes[key] = img;
            resolve();
        };
        img.onerror = () => reject(new Error('배경 이미지를 불러오지 못했어요: ' + file));
        img.src = new URL('../images/' + file, import.meta.url).href;
    })));

    function updateValues(next) {
        values = next;
        const mode = values['maintweet-back-radio'];
        bg.fill(mode === 'solid' ? values['maintweet-back-color'] : mode === 'dark' ? '#252525' : '#f3f3f3');
        theme.image(themes[mode] || null);
        theme.visible(mode !== 'solid');
        for (const binding of bindings) {
            binding.node.text(values[binding.key] || '');
            if (binding.color) binding.node.fill(values[binding.color]);
            if (binding.font) binding.node.fontFamily(values[binding.font]);
        }
        dot.fill(values['maintweet-korea-color']);
        dot.x(ko.x() + ko.width() + 10);
        age.x(dot.x() + dot.width() + 10);
        character.update(state.richText?.['maintweet-character'] || plainDocument(values['maintweet-character']));
        owner.update(state.richText?.['maintweet-owner'] || plainDocument(values['maintweet-owner']));
        const credit = values['maintweet-main-image-citation'] || '';
        citation.text(credit ? 'ⓒ ' + credit : '');
        citation.visible(!!main.image() && !!credit.trim());
        layer.batchDraw();
    }
    document.fonts?.addEventListener('loadingdone', () => {
        character.invalidate();
        owner.invalidate();
        updateValues(store.state.values);
    });
    return {
        layer,
        ready,
        updateState(next) {
            state = next;
        },
        updateValues,
        updateImage(id, image) {
            if (id !== 'maintweet-main-image') return;
            main.image(null);
            mainBox.fill(image ? 'rgba(0,0,0,0)' : '#434343');
            if (image) {
                const ratio = Math.max(620 / image.naturalWidth, 1080 / image.naturalHeight),
                    width = 620 / ratio,
                    height = 1080 / ratio;
                // 이미지를 바꿀 때만 알파 마스크를 생성합니다. 배경색과 무관하게 왼쪽이 투명해집니다.
                const faded = document.createElement('canvas');
                faded.width = 620;
                faded.height = 1080;
                const ctx = faded.getContext('2d');
                ctx.drawImage(image, (image.naturalWidth - width) / 2, (image.naturalHeight - height) / 2, width, height, 0, 0, 620, 1080);
                ctx.globalCompositeOperation = 'destination-in';
                const alpha = ctx.createLinearGradient(0, 0, 310, 0);
                alpha.addColorStop(0, 'rgba(0,0,0,0)');
                alpha.addColorStop(1, 'rgba(0,0,0,1)');
                ctx.fillStyle = alpha;
                ctx.fillRect(0, 0, 620, 1080);
                main.image(faded);
            }
            updateValues(values);
        }
    };
}
export default {
    templateId,
    author,
    size,
    fonts,
    fontLabels,
    tabs,
    groups,
    fields,
    positions,
    imageField,
    initialState,
    restoreFormatting,
    formOptions,
    createScene
};
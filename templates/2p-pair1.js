export const templateId = '2p-pair1';
export const author = '@baegop157902 | 배경이미지도 바꿀 수 있어요.';
export const size = {
    width: 1920,
    height: 1080,
};

const commonGroups = [
    ['bg', '뒷배경'],
    ['main', '메인 이미지'],
    ['maininfo', '메인 설명'],
    ['subinfo', '키워드'],
    ['sub1', '서브 설명1'],
    ['sub2', '서브 설명2'],
    ['sub3', '서브 설명3']
];
const characterGroups = [
    ['profile', '두상'],
    ['moe', '외관&모에화'],
    ['description', '기타설명']
];

export function groups(state, side) {
    if (side === 'common') return commonGroups;
    if (side === 'left' || side === 'right') return characterGroups;
    return [];
}

export const positions = {
    'common-bg-image': {
        x: 0,
        y: 0,
        width: 1920,
        height: 1080
    },
    'common-main-image': {
        x: 0,
        y: 0,
        width: 500,
        height: 1080
    },
    'common-sub1-image': {
        x: 1320,
        y: 76,
        width: 248,
        height: 248
    },
    'common-sub2-image': {
        x: 1320,
        y: 418,
        width: 248,
        height: 248
    },
    'common-sub3-image': {
        x: 1320,
        y: 760,
        width: 248,
        height: 248
    },
    'left-profile-image': {
        x: 579,
        y: 40,
        width: 122,
        height: 122
    },
    'right-profile-image': {
        x: 1062,
        y: 40,
        width: 122,
        height: 122
    },
    'left-moe-image': {
        x: 606,
        y: 328,
        width: 226,
        height: 319
    },
    'right-moe-image': {
        x: 927,
        y: 328,
        width: 226,
        height: 319
    }
};

export function imageId(side, group) {
    return `${side}-${group}-image`;
}

export function fields(side, group) {
    if (!groups(null, side).some(([id]) => id === group)) return [];

    const field = (key, label, type = 'text') => ({
        id: `${side}-${key}`,
        label,
        type
    });
    switch (group) {
        case 'bg':
            return [{
                ...field('bg-mode', '배경 선택', 'radio'),
                options: [
                    { value: 'light', label: '라이트' },
                    { value: 'dark', label: '다크' },
                    { value: 'image', label: '이미지' }
                ]
            },
            {
                ...field('bg-check', '배경', 'checkbox'),
                visibleWhen: { id: `${side}-bg-mode`, value: 'image' }
            },
            {
                ...field('bg-color', '배경색', 'color'),
                visibleWhen: { id: `${side}-bg-mode`, value: 'image' }
            },
            field('blur', '배경 흐리게', 'checkbox')];
        case 'maininfo':
            return [
                field('pair-name', '페어명'),
                field('pair-name-background', '배경색', 'color'),
                field('pair-name-color', '글자색', 'color')
            ];
        case 'subinfo':
            return [
                field('keyword', '키워드'),
                field('keyword-background', '배경색', 'color'),
                field('keyword-color', '글자색', 'color')
            ];
        case 'sub1':
        case 'sub2':
        case 'sub3':
            return [
                field(`${group}-background-enabled`, '배경색 추가', 'checkbox'),
                {
                    ...field(`${group}-background-color`, '배경색', 'color'),
                    visibleWhen: `${side}-${group}-background-enabled`
                },
                field(`${group}-reference-name`, 'AU or 참고이미지 제목'),
                field(`${group}-reference-text`, '상세내용', 'textarea')
            ];
        case 'profile':
            return [
                field(`${group}-background-enabled`, '배경색 추가', 'checkbox'),
                {
                    ...field(`${group}-background-color`, '배경색', 'color'),
                    visibleWhen: `${side}-${group}-background-enabled`
                }
            ];
        case 'moe':
            return [
                field('cm', '키'), 
                field('animal-background-color', '동물화 배경색', 'color'),
                field('animal-color', '동물화 글자색', 'color'),
                field('animal', '동물화'),
                field('hair', '머리색', 'color'), 
                field('left-eye', '왼쪽 눈', 'color'), 
                field('right-eye', '오른쪽 눈', 'color')
            ];
        case 'description':
            return [field('description-text', '외관설명', 'textarea')];
        default:
            return [];
    }
}

//저장
export function initialState(id = templateId) {
    const values = {};
    for (const group of ['sub1', 'sub2', 'sub3']) {
        values[`common-${group}-background-enabled`] = false;
        values[`common-${group}-background-color`] = '#ffffff';
        values[`common-${group}-reference-name`] = '제목';
        values[`common-${group}-reference-text`] = '상세내용';
        values[`common-${group}-image-citation`] = '';
    }
    Object.assign(values, {
        'common-bg-image-citation': '',
        'common-main-image-citation': '',
        'left-profile-image-citation': '',
        'right-profile-image-citation': '',
        'left-moe-image-citation': '',
        'right-moe-image-citation': '',

        'common-bg-mode': 'light',
        'common-bg-check': false,
        'common-bg-color': '#ffffff',
        'common-blur': true,
        'common-pair-name': '페어명',
        'common-pair-name-background': '#ffffff',
        'common-pair-name-color': '#323232',
        'common-keyword': '키워드',
        'common-keyword-background': '#ffffff',
        'common-keyword-color': '#323232',

        'left-profile-background-enabled': false,
        'left-profile-background-color': '#ffffff',
        'right-profile-background-enabled': false,
        'right-profile-background-color': '#ffffff',

        'left-cm': '키',
        'left-animal': '동물화',
        'left-hair': '#323232',
        'left-left-eye': '#323232',
        'left-right-eye': '#323232',
        'left-animal-background-color': '#dfe3e6',
        'left-animal-color': '#323232',
        'right-cm': '키',
        'right-animal': '동물화',
        'right-hair': '#323232',
        'right-left-eye': '#323232',
        'right-right-eye': '#323232',
        'right-animal-background-color': '#dfe3e6',
        'right-animal-color': '#323232',

        'left-description-text': '외관설명',
        'right-description-text': '외관설명'
    });
    return {
        schemaVersion: 1,
        templateId: id,
        values,
        touched: {},
        images: {},
        stickers: []
    };
}

export function createPairScene(stage, openEditor) {
    const K = window.Konva;
    const layer = new K.Layer();
    stage.add(layer);

    const bg = new K.Rect({
        ...size,
        fill: '#ffffff'
    });
    layer.add(bg);

    const main = new K.Group(),
        boxes = new K.Group(),
        content = new K.Group();
    layer.add(main, boxes, content);

    const imageNodes = new Map(),
        textBindings = [],
        colorBindings = [];
    let currentValues = initialState().values;
    const themeImages = new Map();
    let uploadedBackground = null;

    function setImage(item, img) {
        item.image.image(img || null);
        if (img) {
            const ratio = Math.max(item.p.width / img.naturalWidth, item.p.height / img.naturalHeight);
            const width = item.p.width / ratio, height = item.p.height / ratio;
            item.image.crop({
                x: (img.naturalWidth - width) / 2,
                y: (img.naturalHeight - height) / 2,
                width, height
            });
        }
    }

    function refreshBackground() {
        const item = imageNodes.get('common-bg-image');
        if (!item) return;
        const mode = currentValues['common-bg-mode'] || 'light';
        const img = mode === 'image' ? uploadedBackground : themeImages.get(mode);
        setImage(item, img);
        item.plus.visible(mode === 'image' && !img);
        const backgroundFill = mode === 'dark'
            ? '#161616'
            : mode === 'image'
                ? currentValues['common-bg-check']
                    ? currentValues['common-bg-color']
                    : 'rgba(0,0,0,0)'
                : '#ffffff';
        item.rect.fill(backgroundFill);

        const isBlur = currentValues['common-blur'];
        if (isBlur && img) {
            item.image.filters([K.Filters.Blur]);
            item.image.blurRadius(20);
            item.image.cache();
        } else {
            item.image.filters([]);
            item.image.clearCache();
        }
    }

    let prevBgState = null;

    function updateBackground(id, item) {
        if (id === 'common-bg-image') { 
            const currentBgState = [
                currentValues['common-bg-mode'],
                currentValues['common-bg-check'],
                currentValues['common-bg-color'],
                currentValues['common-blur']
            ].join('-');
            if (prevBgState !== currentBgState) {
                refreshBackground(); 
                prevBgState = currentBgState;
            }
            return; 
        }
        let side, group;
        if (id.startsWith('common')) {
            side = 'common';
            group = id.replace('common', '').replace('-image', '').replace(/^-/, '');
        } else {
            side = id.startsWith('left-') ? 'left' : 'right';
            group = id.slice(side.length + 1).replace(/-image$/, '');
        }
        const supported = ['profile', 'sub1', 'sub2', 'sub3'].includes(group);
        const hasImage = !!item.image.image();
        const prefix = group ? `${side}-${group}` : side;
        const fill = !hasImage ? '#323232' : supported && currentValues[`${prefix}-background-enabled`] ?
            currentValues[`${prefix}-background-color`] : supported ? 'rgba(0,0,0,0)' : null;
        item.rect.fill(fill);
    }

    const shadow = {
        shadowColor: '#323232',
        shadowBlur: 3,
        shadowOffset: {
            x: 0,
            y: 3
        },
        shadowOpacity: 0.25
    };

    function clickable(node, side, group) {
        node.on('click tap', e => {
            e.cancelBubble = true;
            openEditor(side, group, node);
        });
        node.on('mouseenter', () => {
            stage.container().style.cursor = 'pointer';
        });
        node.on('mouseleave', () => {
            stage.container().style.cursor = '';
        });
    }

    function addImage(id, parent) {
        const p = positions[id];
        const round = id.includes('profile') || id.includes('sub') ? p.width / 2 : 0;
        const group = new K.Group({
            x: p.x,
            y: p.y
        });
        const rect = new K.Rect({
            width: p.width,
            height: p.height,
            fill: '#323232',
            cornerRadius: round,
            ...(round ? shadow : {})
        });
        const clip = new K.Group({
            clipFunc(ctx) {
                ctx.beginPath();
                ctx.roundRect(0, 0, p.width, p.height, round);
                ctx.closePath();
            }
        });
        const image = new K.Image({
            width: p.width,
            height: p.height,
            listening: false
        });
        clip.add(image);
        const plus = new K.Text({
            text: '+',
            width: p.width,
            height: p.height,
            align: 'center',
            verticalAlign: 'middle',
            fill: '#fff',
            fontSize: 28,
            listening: false
        });

        const isBg = id === 'common-bg-image';
        const citationText = new K.Text({
            width: isBg ? p.width - 10 : p.width,
            y: p.height - 20, // 글자크기(14) + 하단여백(6) = 밑에서 20px 띄움
            align: isBg ? 'right' : 'center',
            fontSize: 14,
            fontFamily: 'Pretendard',
            fill: '#5f5f5f',
            stroke: '#ffffff',
            strokeWidth: 2,
            fillAfterStrokeEnabled: true,
            listening: false,
            visible: false
        });

        group.add(rect, clip, plus, citationText);
        parent.add(group);

        let side, key;
        if (id.startsWith('common')) {
            side = 'common';
            key = id.replace('common', '').replace(/^-/, '').replace(/-image$/, '');
        } else {
            side = id.startsWith('left') ? 'left' : 'right';
            key = id.slice(side.length + 1).replace(/-image$/, '');
        }
        clickable(group, side, key);
        imageNodes.set(id, {
            image,
            plus,
            rect,
            p,
            citationText
        });
    }

    function text(attrs, binding, side, group, parentGroup = content) {
        const node = new K.Text({
            fontFamily: 'Pretendard',
            fill: '#323232',
            fontSize: 16,
            ...attrs
        });
        parentGroup.add(node);
        if (binding) textBindings.push([node, binding]);
        if (side) clickable(node, side, group);
        return node;
    }

    addImage('common-bg-image', main);
    addImage('common-main-image', main);

    text({
        x: 564,
        y: 30,
        fontFamily: 'Pretendard',
        fontSize: 64,
        fill: '#646464',
        text: 'A'
    }, null, null, null, main);
    text({
        x: 1162,
        y: 30,
        fontFamily: 'Pretendard',
        fontSize: 64,
        fill: '#646464',
        text: 'B'
    }, null, null, null, main);

    const pairNameBox = new K.Rect({
        x: 742,
        y: 42,
        width: 280,
        height: 40,
        fill: '#ffffff',
        cornerRadius: 20,
        ...shadow
    });
    boxes.add(pairNameBox);
    colorBindings.push([pairNameBox, 'common-pair-name-background']);
    clickable(pairNameBox, 'common', 'maininfo');

    text({
        x: 742,
        y: 42,
        width: 280,
        height: 40,
        align: 'center',
        verticalAlign: 'middle',
        wrap: 'none',
        fontStyle: '600'
    }, {
        text: 'common-pair-name',
        color: 'common-pair-name-color'
    }, 'common', 'maininfo');

    const keywordBox = new K.Rect({
        x: 742,
        y: 99,
        width: 280,
        height: 68,
        fill: '#ffffff',
        cornerRadius: 10,
        ...shadow
    });
    boxes.add(keywordBox);
    colorBindings.push([keywordBox, 'common-keyword-background']);
    clickable(keywordBox, 'common', 'subinfo');

    text({
        x: 742,
        y: 99,
        width: 280,
        height: 68,
        align: 'center',
        verticalAlign: 'middle',
        wrap: 'none',
        fontStyle: '400'
    }, {
        text: 'common-keyword',
        color: 'common-keyword-color'
    }, 'common', 'subinfo');

    boxes.add(new K.Rect({
        x: 562,
        y: 214,
        width: 639,
        height: 500,
        fill: '#ffffff',
        cornerRadius: 10,
        ...shadow
    }));

    boxes.add(new K.Rect({
        x: 562,
        y: 753,
        width: 639,
        height: 357,
        fill: '#ffffff',
        cornerRadius: 10,
        ...shadow
    }))

    boxes.add(new K.Line({
        points: [880, 242, 880, 688],
        stroke: '#ababab',
        strokeWidth: 1,
        dash: [10, 4]
    }));

    boxes.add(new K.Line({
        points: [880, 782, 880, 1170],
        stroke: '#ababab',
        strokeWidth: 1,
        dash: [10, 4]
    }));

    for (const side of ['left', 'right']) {
        const x = side === 'left' ? 640 : 960;

        const animalBox = new K.Rect({
            x, 
            y: 260,
            width: 160,
            height: 40,
            fill: '#f4f8fa',
            cornerRadius: 20,
        }); 
        boxes.add(animalBox);
        clickable(animalBox, side, 'moe');
        colorBindings.push([animalBox, `${side}-animal-background-color`]);

        text({
            x, 
            y: 260,
            width: 160,
            height: 40,
            align: 'center',
            verticalAlign: 'middle',
            fontStyle: '700'
        }, {
            text: `${side}-animal`,
            color: `${side}-animal-color`
        }, side, 'moe');

        text({
            x,
            y: 240,
            width: 160,
            align: 'center',
            verticalAlign: 'middle',
            fontStyle: '400'
        }, {
            text: `${side}-cm`,
            suffix: ' cm'
        }, side, 'moe');

        boxes.add(new K.Rect({
            x, 
            y: 780,
            width: 160,
            height: 40,
            fill: '#434343',
            cornerRadius: 20,
        })); 

        text({
            x,
            y: 780,
            width: 160,
            height: 40,
            align: 'center',
            verticalAlign: 'middle',
            fontStyle: '400',
            text: '기타 사항',
            fill: '#ffffff'
        })
    }

    for (const side of ['left', 'right']) {
        const x = side === 'left' ? 584 : 906;

            text({
                x, 
                y: 850,
                width: 276,
                height: 206,
                align: 'left',
                verticalAlign: 'top',
                wrap: 'hidden',
                lineHeight: 1.5,
                fontStyle: '400'
            }, {
                text: `${side}-description-text`,
            }, side, 'description');
    }

    for (const side of ['left', 'right']) {
        const x = side === 'left' ? 584 : 901;

            const hairBox = new K.Rect({
            x,
            y: 260,
            width: 36,
            height: 36,
            cornerRadius: 30,
        });
        boxes.add(hairBox);
        colorBindings.push([hairBox, `${side}-hair`]);
        clickable(hairBox, side, 'moe');

        text({
            x,
            y: 240,
            width: 36,
            align: 'center',
            verticalAlign: 'middle',
            fontStyle: '400',
            fill: '#434343',
            text: 'Hair'
        })
    }

    for (const side of ['left', 'right']) {
        const x = side === 'left' ? 816 : 1138;

        const lefteyeBox = new K.Rect({
            x,
            y: 270,
            width: 18,
            height: 18,
            cornerRadius: 30,
        });
        boxes.add(lefteyeBox);
        colorBindings.push([lefteyeBox, `${side}-left-eye`]);
        clickable(lefteyeBox, side, 'moe');
    }

    for (const side of ['left', 'right']) {
        const x = side === 'left' ? 842 : 1164;

        const righteyeBox = new K.Rect({
            x,
            y: 270,
            width: 18,
            height: 18,
            cornerRadius: 30,
        });
        boxes.add(righteyeBox);
        colorBindings.push([righteyeBox, `${side}-right-eye`]);
        clickable(righteyeBox, side, 'moe');
    }

    for (const side of ['left', 'right']) {
        const x = side === 'left' ? 820 : 1142;

        text({
            x,
            y: 240,
            align: 'center',
            verticalAlign: 'middle',
            fontStyle: '400',
            fill: '#434343',
            text: 'Eyes'
        })
    }

    for (const [group, y] of [
        ['sub1', 80], 
        ['sub2', 422], 
        ['sub3', 764]
    ]) {

        boxes.add(new K.Rect({
            x: 1590,
            y: y + 30,
            width: 280,
            height: 208,
            fill: '#ffffff',
            cornerRadius: 10,
        })); 
        
        const subBox = new K.Rect({
            x: 1606,
            y,
            width: 248,
            height: 48,
            fill: '#434343',
            cornerRadius: 30,
            ...shadow
        });
        boxes.add(subBox);
        clickable(subBox, 'common', group);

        text({
            x: 1606,
            y: y + 66,
            width: 248,
            height: 152,
            fontSize: 16,
            fontStyle: '400',
            align: 'left',
            verticalAlign: 'middle',
            wrap: 'hidden',
            lineHeight: 1.5,
        }, {
            text: `common-${group}-reference-text`
        }, 'common', group);

        text({
            x: 1606,
            y,
            width: 248,
            height: 48,
            align: 'center',
            verticalAlign: 'middle',
            fill: '#ffffff'
        }, {
            text: `common-${group}-reference-name`
        }, 'common', group);
    }


    addImage('common-sub1-image', content);
    addImage('common-sub2-image', content);
    addImage('common-sub3-image', content);
    addImage('left-profile-image', content);
    addImage('right-profile-image', content);
    addImage('left-moe-image', content);
    addImage('right-moe-image', content);

    boxes.add(new K.Line({
        points: [1267, 64, 1267, 1036],
        stroke: '#ababab',
        strokeWidth: 1,
        dash: [10, 4]
    }));

    const ready = Promise.all(['light', 'dark'].map(mode => new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => { themeImages.set(mode, img); resolve(); };
        img.onerror = () => reject(new Error(`${mode}-theme.png 배경 이미지를 불러오지 못했어요.`));
        img.src = new URL(`../images/${mode}-theme.png`, import.meta.url).href;
    }))).then(() => { refreshBackground(); layer.batchDraw(); });

    return {
        layer,
        ready,
        updateValues(values) {
            currentValues = values;
            for (const [id, item] of imageNodes) {
                updateBackground(id, item);
                
                if (item.citationText) {
                    const textVal = values[`${id}-citation`];
                    const hasImg = !!item.image.image();
                    if (hasImg && textVal && textVal.trim() !== '') {
                        item.citationText.text('ⓒ' + textVal);
                        item.citationText.visible(true);
                    } else {
                        item.citationText.visible(false);
                    }
                }
            }
            for (const [node, b] of textBindings) {
                let textValue = values[b.text] || '';
                if (textValue && b.suffix) {
                    textValue += b.suffix;
                }
                node.text(textValue);
                if (b.color) node.fill(values[b.color]);
                if (b.font) node.fontFamily(values[b.font]);
            }
            for (const [node, key] of colorBindings) node.fill(values[key]);
            layer.batchDraw();
        },
        updateImage(id, img) {
            const item = imageNodes.get(id);
            if (!item) return;
            if (id === 'common-bg-image') {
                uploadedBackground = img || null;
                refreshBackground();
                layer.batchDraw();
                return;
            }
            setImage(item, img);
            item.plus.visible(!img);
            updateBackground(id, item);
            
            if (item.citationText) {
                const textVal = currentValues[`${id}-citation`];
                item.citationText.visible(!!img && !!textVal && textVal.trim() !== '');
            }
            layer.batchDraw();
        }
    };
}

export const tabs = [{
        id: 'common',
        label: '공통',
        heading: '공통'
    },
    {
        id: 'left',
        label: '왼쪽 캐릭터',
        heading: '왼쪽'
    },
    {
        id: 'right',
        label: '오른쪽 캐릭터',
        heading: '오른쪽'
    },
    {
        id: 'stickers',
        label: '스티커',
        type: 'stickers'
    }
];

export function imageField(side, group) {
    if (!groups(null, side).some(([key]) => key === group)) return null;
    const id = imageId(side, group);
    if (!positions[id]) return null;
    return {
        id,
        ...positions[id],
        ...(side === 'common' && group === 'bg' ? {
            visibleWhen: { id: 'common-bg-mode', value: 'image' },
            placement: 'afterFields'
        } : {}),
        round: ['profile', 'sub1', 'sub2', 'sub3'].includes(group),
        className: group === 'main' ? 'image-upload-ld' : ''
    };
}

export default {
    templateId,
    author,
    size,
    tabs,
    groups,
    fields,
    positions,
    imageField,
    initialState,
    createScene: createPairScene
};

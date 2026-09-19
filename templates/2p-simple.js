export const templateId = '2p-simple';
export const author = '@baegop157902';
export const size = {
    width: 1920,
    height: 1080
};
export const fonts = [
    'Pretendard',
    'Apple SD Gothic Neo',
    'Black Han Sans',
    'Song Myung',
    'Cafe24 PRO UP',
    'Grandiflora One',
    'Tektur',
    'Lilita One',
    'GOFIRE',
    'Top Speed',
    'Orandakan Kana',
    'Iansui',
    'Dela Gothic One',
    'Kaisei Decol'
];

export const groups = [
    ['profile', '두상'],
    ['name', '이름&캐프'],
    ['LD', '전신 배경'],
    ['SD', '서브 이미지'],
    ['description', '외관설명'],
    ['colors', '머리·눈 색'],
    ['add-1', '추가 이미지 1'],
    ['add-2', '추가 이미지 2'],
    ['add-3', '추가 이미지 3'],
    ['flat', '한 줄 설명']
];

export const positions = {
    'left-LD-image': {
        x: 0,
        y: 0,
        width: 336,
        height: 1080
    },
    'right-LD-image': {
        x: 1584,
        y: 0,
        width: 336,
        height: 1080
    },
    'left-profile-image': {
        x: 285,
        y: 45,
        width: 194,
        height: 194
    },
    'right-profile-image': {
        x: 1440,
        y: 45,
        width: 194,
        height: 194
    },
    'left-SD-image': {
        x: 657,
        y: 216,
        width: 244,
        height: 338
    },
    'right-SD-image': {
        x: 1023,
        y: 216,
        width: 244,
        height: 338
    },
    'left-add-1': {
        x: 290,
        y: 712,
        width: 199,
        height: 199
    },
    'left-add-2': {
        x: 510,
        y: 712,
        width: 199,
        height: 199
    },
    'left-add-3': {
        x: 730,
        y: 712,
        width: 199,
        height: 199
    },
    'right-add-1': {
        x: 994,
        y: 712,
        width: 199,
        height: 199
    },
    'right-add-2': {
        x: 1213,
        y: 712,
        width: 199,
        height: 199
    },
    'right-add-3': {
        x: 1432,
        y: 712,
        width: 199,
        height: 199
    }
};

export function imageId(side, group) {
    return group.startsWith('add-') ? `${side}-${group}` : `${side}-${group}-image`;
}

export function fields(side, group) {
    const field = (key, label, type = 'text') => ({
        id: `${side}-${key}`,
        label,
        type
    });
    switch (group) {
        case 'profile':
        case 'add-1':
        case 'add-2':
        case 'add-3':
            return [
                field(`${group}-background-enabled`, '배경', 'checkbox'),
                { ...field(`${group}-background-color`, '배경색', 'color'),
                    visibleWhen: `${side}-${group}-background-enabled` }
            ];
        case 'name':
            return [field('korea-name', '이름'), field('korea-name-color', '이름 색상', 'color'), field('etc-name', '캐치프레이즈'), field('etc-name-color', '캐치프레이즈 색상', 'color'), field('sub-font', '캐치프레이즈 폰트', 'font')];
        case 'description':
            return [field('clothes', '평소의상', 'textarea'), field('charac', '외관특징', 'textarea'), field('cm', '키 (cm)'), field('animal', '모에화')];
        case 'colors':
            return [field('hair', '머리 색', 'color'), field('left-eyes', '왼쪽 눈', 'color'), field('right-eyes', '오른쪽 눈', 'color')];
        case 'flat':
            return [field('flat', '한 줄 설명', 'textarea'), field('flat-back-color', '배경 색상', 'color'), field('flat-text-color', '글자 색상', 'color')];
        default:
            return [];
    }
}

export function initialState(id = templateId) {
    const values = {};
    for (const side of ['left', 'right']) {
        for (const group of ['profile', 'add-1', 'add-2', 'add-3']) {
            values[`${side}-${group}-background-enabled`] = false;
            values[`${side}-${group}-background-color`] = '#ffffff';
        }
        Object.assign(values, {
            [`${side}-LD-image-citation`]: '',
            [`${side}-profile-image-citation`]: '',
            [`${side}-SD-image-citation`]: '',
            [`${side}-add-1-citation`]: '',
            [`${side}-add-2-citation`]: '',
            [`${side}-add-3-citation`]: '',

            [`${side}-korea-name`]: '이름',
            [`${side}-etc-name`]: 'Name',
            [`${side}-sub-font`]: 'Pretendard',
            [`${side}-korea-name-color`]: '#323232',
            [`${side}-etc-name-color`]: '#323232',
            [`${side}-clothes`]: '여기에 설명을 적어주세요.',
            [`${side}-charac`]: '여기에 설명을 적어주세요.',
            [`${side}-cm`]: '',
            [`${side}-animal`]: '',
            [`${side}-hair`]: '#323232',
            [`${side}-left-eyes`]: '#323232',
            [`${side}-right-eyes`]: '#323232',
            [`${side}-flat`]: '여기에 설명을 적어주세요.',
            [`${side}-flat-back-color`]: '#323232',
            [`${side}-flat-text-color`]: '#ffffff'
        });
    }
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
        fill: '#F6F6F6'
    });
    layer.add(bg);
    const ld = new K.Group(),
        gradients = new K.Group({
            listening: false
        }),
        boxes = new K.Group(),
        content = new K.Group();
    layer.add(ld, gradients, boxes, content);
    const imageNodes = new Map(),
        textBindings = [],
        colorBindings = [];
    let currentValues = initialState().values;
    function updateBackground(id, item) {
        const side = id.startsWith('left-') ? 'left' : 'right';
        const group = id.slice(side.length + 1).replace(/-image$/, '');
        const supported = ['profile', 'add-1', 'add-2', 'add-3'].includes(group);
        const hasImage = !!item.image.image();
        const fill = !hasImage ? '#323232' : supported && currentValues[`${side}-${group}-background-enabled`]
            ? currentValues[`${side}-${group}-background-color`] : supported ? 'rgba(0,0,0,0)' : null;
        item.rect.fill(fill);
    }
    const shadow = {
        shadowColor: '#231705',
        shadowBlur: 10,
        shadowOffset: {
            x: 0,
            y: 0
        },
        shadowOpacity: 0.26
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
        const p = positions[id],
            round = id.includes('profile') ? p.width / 2 : id.includes('add') ? 10 : 0;
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

        const citationText = new K.Text({
            width: p.width,
            y: p.height - 20, // 글자크기(14) + 하단여백(6) = 밑에서 20px 띄움
            align: 'center',
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
        const side = id.startsWith('left') ? 'left' : 'right';
        const key = id.slice(side.length + 1).replace(/-image$/, '');
        clickable(group, side, key);
        imageNodes.set(id, {
            image,
            plus,
            rect,
            p,
            citationText
        });
    }
    addImage('left-LD-image', ld);
    addImage('right-LD-image', ld);
    gradients.add(new K.Line({
        points: [962, 190, 962, 1035],
        stroke: '#9A9A9A',
        strokeWidth: 1,
        dash: [14, 12]
    }));
    gradients.add(new K.Rect({
        x: 0,
        y: 0,
        width: 340,
        height: 1080,
        fillLinearGradientStartPoint: {
            x: 0,
            y: 0
        },
        fillLinearGradientEndPoint: {
            x: 340,
            y: 0
        },
        fillLinearGradientColorStops: [0.8, 'rgba(246,246,246,0)', 1, 'rgba(246,246,246,1)']
    }));
    gradients.add(new K.Rect({
        x: 1580,
        y: 0,
        width: 340,
        height: 1080,
        fillLinearGradientStartPoint: {
            x: 0,
            y: 0
        },
        fillLinearGradientEndPoint: {
            x: 340,
            y: 0
        },
        fillLinearGradientColorStops: [0, 'rgba(246,246,246,1)', 0.2, 'rgba(246,246,246,0)']
    }));
    for (const [side, x] of [
            ['left', 290],
            ['right', 994]
        ]) {
        boxes.add(new K.Rect({
            x,
            y: 186,
            width: 640,
            height: 480,
            fill: '#fff',
            cornerRadius: 10,
            ...shadow
        }));
        const flat = new K.Rect({
            x,
            y: 932,
            width: 640,
            height: 103,
            fill: '#323232',
            cornerRadius: 10,
            ...shadow
        });
        boxes.add(flat);
        clickable(flat, side, 'flat');
        colorBindings.push([flat, `${side}-flat-back-color`]);
    }
    Object.keys(positions).filter(id => !id.includes('-LD-')).forEach(id => addImage(id, content));

    function text(attrs, binding, side, group) {
        const node = new K.Text({
            fontFamily: 'Pretendard',
            fill: '#323232',
            fontSize: 18,
            ...attrs
        });
        content.add(node);
        if (binding) textBindings.push([node, binding]);
        if (side) clickable(node, side, group);
        return node;
    }
    for (const side of ['left', 'right']) {
        const left = side === 'left',
            x = left ? 500 : 994,
            align = left ? 'left' : 'right';
        text({
            x,
            y: 80,
            width: 424,
            fontSize: 32,
            fontStyle: '600',
            wrap: 'none',
            align
        }, {
            text: `${side}-korea-name`,
            color: `${side}-korea-name-color`
        }, side, 'name');
        text({
            x,
            y: 122,
            width: 430,
            fontSize: 48,
            fontStyle: '800',
            wrap: 'none',
            verticalAlign: 'middle',
            align
        }, {
            text: `${side}-etc-name`,
            color: `${side}-etc-name-color`,
            font: `${side}-sub-font`
        }, side, 'name');
        text({
            x: left ? 333 : 1516,
            y: 269,
            text: '평소의상',
            fontSize: 20,
            fontStyle: '700'
        }, null, side, 'description');
        text({
            x: left ? 333 : 1516,
            y: 370,
            text: '외관특징',
            fontSize: 20,
            fontStyle: '700'
        }, null, side, 'description');
        text({
            x: left ? 333 : 1278,
            y: 296,
            width: 308,
            height: 52,
            align,
            wrap: 'char',
            lineHeight: 1.4
        }, {
            text: `${side}-clothes`
        }, side, 'description');
        text({
            x: left ? 333 : 1278,
            y: 398,
            width: 308,
            height: 150,
            align,
            wrap: 'char',
            lineHeight: 1.4
        }, {
            text: `${side}-charac`
        }, side, 'description');
        text({
            x: left ? 657 : 1023,
            y: 581,
            width: 244,
            align: 'center',
            fontSize: 20,
            fill: '#7B7B7B'
        }, {
            text: `${side}-cm`,
            suffix: ' cm'
        }, side, 'description');
        text({
            x: left ? 657 : 1023,
            y: 612,
            width: 244,
            align: 'center',
            fontSize: 20,
            fill: '#7B7B7B'
        }, {
            text: `${side}-animal`,
            suffix: ' 모에화'
        }, side, 'description');
        text({
            x: left ? 336 : 1344,
            y: 550,
            text: 'HAIR',
            fontSize: 20,
            fontStyle: '700'
        }, null, side, 'colors');
        text({
            x: left ? 492 : 1500,
            y: 550,
            text: 'EYES',
            fontSize: 20,
            fontStyle: '700'
        }, null, side, 'colors');
        for (const [key, cx] of [
                ['hair', left ? 333 : 1341],
                ['left-eyes', left ? 456 : 1464],
                ['right-eyes', left ? 526 : 1534]
            ]) {
            const node = new K.Rect({
                x: cx,
                y: 582,
                width: 52,
                height: 52,
                fill: '#323232',
                cornerRadius: 10,
                ...shadow,
                shadowBlur: 4,
                shadowOpacity: 0.2
            });
            content.add(node);
            colorBindings.push([node, `${side}-${key}`]);
            clickable(node, side, 'colors');
        }
        text({
            x: left ? 290 : 994,
            y: 932,
            width: 640,
            height: 103,
            align: 'center',
            verticalAlign: 'middle',
            fontSize: 21,
            wrap: 'char',
            lineHeight: 1.5
        }, {
            text: `${side}-flat`,
            color: `${side}-flat-text-color`
        }, side, 'flat');
    }
    return {
        layer,
        updateValues(values) {
            currentValues = values;
            for (const [id, item] of imageNodes) {
                updateBackground(id, item);
                
                if (item.citationText) {
                    const textVal = values[`${id}-citation`];
                    const hasImg = !!item.image.image();
                    if (hasImg && textVal && textVal.trim() !== '') {
                        item.citationText.text('ⓒ ' + textVal);
                        item.citationText.visible(true);
                    } else {
                        item.citationText.visible(false);
                    }
                }
            }
            for (const [node, b] of textBindings) {
                node.text(values[b.text] + (b.suffix || ''));
                if (b.color) node.fill(values[b.color]);
                if (b.font) node.fontFamily(values[b.font]);
            }
            for (const [node, key] of colorBindings) node.fill(values[key]);
            layer.batchDraw();
        },
        updateImage(id, img) {
            const item = imageNodes.get(id);
            if (!item) return;
            item.image.image(img || null);
            item.plus.visible(!img);
            updateBackground(id, item);

            if (img) {
                const r = Math.max(item.p.width / img.naturalWidth, item.p.height / img.naturalHeight);
                const w = item.p.width / r,
                    h = item.p.height / r;
                item.image.crop({
                    x: (img.naturalWidth - w) / 2,
                    y: (img.naturalHeight - h) / 2,
                    width: w,
                    height: h
                });
            }
            
            if (item.citationText) {
                const textVal = currentValues[`${id}-citation`];
                item.citationText.visible(!!img && !!textVal && textVal.trim() !== '');
            }
            layer.batchDraw();
        }
    };
}


export const fontLabels = {
    'Pretendard': '[한영일] 프리텐다드',
    'Apple SD Gothic Neo': '[한영일중] 애플 SD 고딕',
    'Black Han Sans': '[한영] Black Han Sans',
    'Song Myung': '[한영] 송명체',
    'Cafe24 PRO UP': '[한영] 카페24 PRO UP',
    'Grandiflora One': '[한영] 능소화',
    'Tektur': '[영] Tektur',
    'Lilita One': '[영] Lilita One',
    'GOFIRE': '[영] GOFIRE',
    'Top Speed': '[영] Top Speed',
    'Orandakan Kana': '[영] Orandakan Kana',
    'Iansui': '[영일] Iansui',
    'Dela Gothic One': '[영일중] Dela Gothic One',
    'Kaisei Decol': '[영일중] Kaisei Decol'
};

export const tabs = [{
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
    },
];
export function imageField(side, group) {
    const id = imageId(side, group);
    if (!positions[id]) return null;
    return {
        id,
        ...positions[id],
        round: group === 'profile',
        className: group === 'LD' ? 'image-upload-ld' : ''
    };
}
export function fontSample(side, group) {
    return group === 'name' ? {
        textId: `${side}-etc-name`,
        fontId: `${side}-sub-font`
    } : null;
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
    fontSample,
    initialState,
    createScene: createPairScene
};

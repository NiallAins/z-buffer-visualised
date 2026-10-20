//
// Parameters
//
const
    GRID_W = 16,
    GRID_WM = Math.ceil((Math.max(
        window.innerWidth / window.innerHeight,
        window.innerHeight / window.innerWidth
    ) + 2) * GRID_W),
    CELL_W = Math.floor(
        Math.min(window.innerWidth, window.innerHeight) /
        ((GRID_W * 2) + 2)
    ),
    COLOR = {
        grid: '#666',
        cell: [259, 359],
        text: '#000',
        trigon: '#fff8',
        points: ['cornflowerblue', 'coral', 'seagreen']
    },
    LINE_W = {
        grid: 1,
        axes: 3,
        trigon: 0.01
    }
let
    trigon = [[1, -1, -0.85], [-1, 0, 0], [1, 1, 0.85]]
        .map(p => p.map(c => Math.floor(c * GRID_W * 0.75))),
    trigonPlane = getPlane(trigon);

//
// Page set up
//
const
    CAN = document.createElement('canvas'),
    CTX = CAN.getContext('2d');
CAN.width = Math.ceil(window.innerWidth / 2) * 2;
CAN.height = Math.ceil(window.innerHeight / 2) * 2;
CTX.translate(-0.5, -0.5);
CTX.miterLimit = 1;
CTX.font = Math.ceil(CELL_W) + 'px "Courier New" bold';
CTX.textAlign = 'center';
CTX.textBaseline = 'middle';

// Mouse listeners
let dragP = -2;
CAN.onmouseup = CAN.onmouseleave = () => dragP = -1;
CAN.onmousemove = e => {
    let
        x = (e.clientX - (CAN.width / 2)) / CELL_W,
        y = (e.clientY - (CAN.height / 2)) / CELL_W;
    if (dragP > -1) {
        let s = norm(trigon[dragP][2], -GRID_W, GRID_W, 0.5, 1.5);
        updatePoint(dragP, 0, Math.floor(x / s), true);
        updatePoint(dragP, 1, Math.floor(y / s));
    } else {
        let d = trigon.findIndex(p => {
            p = pointTo2D(p);             
            return Math.pow(p[0] - x, 2) + Math.pow(p[1] - y , 2) < 2
        });
        if (e.buttons) {
            dragP = d;
        }
        CAN.style.cursor = d > -1 ? 'pointer' : 'default'
    }
};


function initPage() {
    let inputHtml = '';
    for (let p = 0; p < 3; p++) {
        for (let c = 0; c < 3; c++) {
            inputHtml += `
                <div style="color: ${COLOR.points[p]}">
                    P<sub>${p}</sub>${'XYZ'[c]}
                    <input
                        type="range"
                        min="-${GRID_W}"
                        max="${GRID_W}"
                        step="1"
                        value="${trigon[p][c]}"
                        oninput="updatePoint(${p}, ${c}, event.target.value)"
                    />
                </div>
            `;
        }
    }
    document.body.innerHTML += '<div>' + inputHtml + '<div>';
    document.body.appendChild(CAN);
}

function updatePoint(p, c, value, preventRender) {
    trigon[p][c] = value;
    if (!preventRender) {
        trigonPlane = getPlane(trigon);
        render();
    }
}

function render() {
    CTX.clearRect(0, 0, CAN.width, CAN.height);
    CTX.save();
        CTX.translate(CAN.width / 2, CAN.height / 2);
        renderCells();
        renderGrid();
        renderPoints();
    CTX.restore();
}

function renderGrid() {
    // Draw grid
    CTX.beginPath();
    for (let x = -GRID_WM; x < GRID_WM; x++) {
        CTX.moveTo(x * CELL_W, -CAN.height);
        CTX.lineTo(x * CELL_W, CAN.height);
    }
    for (let y = -GRID_WM; y < GRID_WM; y++) {
        CTX.moveTo(-CAN.width, y * CELL_W);
        CTX.lineTo(CAN.width, y * CELL_W);
    }
    CTX.strokeStyle = COLOR.grid;
    CTX.lineWidth = LINE_W.grid;
    CTX.stroke();
    CTX.beginPath();
        CTX.moveTo(0, -CAN.height);
        CTX.lineTo(0, CAN.height);
        CTX.moveTo(-CAN.width, 0);
        CTX.lineTo(CAN.width, 0);
    CTX.lineWidth = LINE_W.axes;
    CTX.stroke();
}

// Project point in range[minIn, maxIn] to range[minOut, maxOut]
function norm(value, minIn, maxIn, minOut = 0, maxOut = 1) {
    return minOut + (((value - minIn) * (maxOut - minOut)) / (maxIn - minIn));
}

function pointTo2D(p) {
    const SCALE = norm(p[2], -GRID_W, GRID_W, 0.5, 1.5);
    return [
        p[0] * SCALE,
        p[1] * SCALE,
        SCALE
    ];
}

function renderPoints() {
    const POINTS = trigon
        .map(p => pointTo2D(p))
        .map(p => p.map(c => c * CELL_W));
    
    // Draw edges
    CTX.fillStyle = COLOR.trigon;
    POINTS.forEach((p0, pi, pa) => {
        let
            p1 = pa[(pi + 1) % pa.length],
            ang = Math.atan2(p1[1] - p0[1], p1[0] - p0[0]) + (Math.PI * 0.5),
            p0xs = Math.cos(ang) * p0[2] * p0[2] * LINE_W.trigon,
            p0ys = Math.sin(ang) * p0[2] * p0[2] * LINE_W.trigon,
            p1xs = Math.cos(ang) * p1[2] * p1[2] * LINE_W.trigon,
            p1ys = Math.sin(ang) * p1[2] * p1[2] * LINE_W.trigon;
        CTX.beginPath();
            CTX.moveTo(p0[0] + p0xs, p0[1] + p0ys);
            CTX.lineTo(p0[0] - p0xs, p0[1] - p0ys);
            CTX.lineTo(p1[0] - p1xs, p1[1] - p1ys);
            CTX.lineTo(p1[0] + p1xs, p1[1] + p1ys);
            CTX.closePath();
        CTX.fill();
    });
    
    // Draw trigon
    POINTS.forEach((p, pi) => {
        CTX.beginPath();
            CTX.arc(
                p[0], p[1],
                p[2],
                0, Math.PI * 2
            );
        CTX.fillStyle = COLOR.points[pi];
        CTX.fill();
        CTX.fillStyle = COLOR.text;
        CTX.fillText(trigon[pi][2], p[0], p[1]);
    });
}

function renderCells() {
    const POINTS = trigon.map(p => pointTo2D(p));
    let
        x0 = Math.min(...POINTS.map(p => p[0])),
        x1 = Math.max(...POINTS.map(p => p[0])),
        y0 = Math.min(...POINTS.map(p => p[1])),
        y1 = Math.max(...POINTS.map(p => p[1]));
    x0 = Math.floor(x0 / CELL_W) * CELL_W;
    y0 = Math.floor(y0 / CELL_W) * CELL_W;
    for (let y = y0; y <= y1; y++) {
        for (let x = x0; x <= x1; x++) {
            if (pointInsideTrigon(x + 0.5, y + 0.5, POINTS)) {
                let z = getZ(x + 0.5, y + 0.5, trigonPlane);
                CTX.fillStyle = `hsl(${
                    Math.floor(norm(z, -GRID_W, GRID_W, COLOR.cell[0], COLOR.cell[1]))
                }, 50%, ${
                    Math.floor(norm(z, -GRID_W, GRID_W, 30, 70))
                }%)`;
                CTX.fillRect(x * CELL_W, y * CELL_W, CELL_W, CELL_W);
                CTX.fillStyle = COLOR.text;
                CTX.fillText(
                    Math.floor(z),
                    (x + 0.5) * CELL_W,
                    (y + 0.5) * CELL_W
                );
            }
        }
    }
}

function getPlane(ps) {
    let
        A = [
            ps[1][0] - ps[0][0],
            ps[1][1] - ps[0][1],
            ps[1][2] - ps[0][2]
        ],
        B = [
            ps[2][0] - ps[0][0],
            ps[2][1] - ps[0][1],
            ps[2][2] - ps[0][2]
        ],
        norm = [
            A[1] * B[2] - A[2] * B[1],
            A[2] * B[0] - A[0] * B[2],
            A[0] * B[1] - A[1] * B[0]
        ];
    return [
        (norm[0] * ps[0][0] + norm[1] * ps[0][1] + norm[2] * ps[0][2]) / norm[2],
        norm[0] / norm[2],
        norm[1] / norm[2]
    ];
}

function getZ(x, y, plane) {
    return Math.floor(plane[0] - plane[1] * x - plane[2] * y);
}

function pointInsideTrigon(x, y, tri) {
    let
        as_x = x - tri[0][0],
        as_y = y - tri[0][1],
        s_ab = (tri[1][0] - tri[0][0]) * as_y - (tri[1][1] - tri[0][1]) * as_x > 0;
    return !(
        ((tri[2][0] - tri[0][0]) * as_y - (tri[2][1] - tri[0][1]) * as_x > 0 === s_ab) ||
        ((tri[2][0] - tri[1][0]) * (y - tri[1][1]) - (tri[2][1] - tri[1][1])*(x - tri[1][0]) > 0 !== s_ab)
    );
}

initPage();
render();
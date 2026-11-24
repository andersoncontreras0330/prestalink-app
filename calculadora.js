var CALC = JSON.parse(document.getElementById('calc-datos').textContent);
var MOTOR = (function () {
  if (!Array.prototype.at) {
    Object.defineProperty(Array.prototype, 'at', { value: function (i) { return this[i < 0 ? this.length + i : i]; } });
  }
  var mods = { i18n: {
    textos: function () { return { comun: CALC.comun }; },
    localeActual: function () { return CALC.locale; }
  } };
  var pedir = function (r) { return mods[r.split('/').pop()] || {}; };
  var def = function (nombre, f) { var e = {}; f(e, pedir); mods[nombre] = e; };
  def('interes', function (exports, require) {
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sumaPorDias = exports.FRECUENCIAS_INTERES = exports.PERIODOS_ANIO = exports.DIAS_PERIODO = void 0;
exports.convertirTasa = convertirTasa;
exports.sumarPeriodos = sumarPeriodos;
exports.fraccionPrimerPeriodo = fraccionPrimerPeriodo;
exports.calcularInteres = calcularInteres;
exports.redondear = redondear;
exports.planDeCuotas = planDeCuotas;
exports.estimarSinVencimiento = estimarSinVencimiento;
exports.moraDeCuota = moraDeCuota;
exports.repartirAbono = repartirAbono;
exports.cuotaNivelada = cuotaNivelada;
exports.fraccionPorDias = fraccionPorDias;
exports.DIAS_PERIODO = {
    diario: 1,
    semanal: 7,
    quincenal: 15,
    mensual: 30,
    anual: 365,
};
exports.PERIODOS_ANIO = {
    diario: 365,
    semanal: 52,
    quincenal: 24,
    mensual: 12,
    anual: 1,
};
function convertirTasa(tasa, de, a) {
    var _a, _b;
    if (de === a)
        return tasa;
    const anual = tasa * ((_a = exports.PERIODOS_ANIO[de]) !== null && _a !== void 0 ? _a : 12);
    return Math.round((anual / ((_b = exports.PERIODOS_ANIO[a]) !== null && _b !== void 0 ? _b : 12)) * 10000) / 10000;
}
const diasEntre = (a, b) => Math.round((b.getTime() - a.getTime()) / 86400000);
function sumarPeriodos(f, periodo, n) {
    var _a;
    const d = new Date(f.getFullYear(), f.getMonth(), f.getDate());
    if (periodo === 'mensual' || periodo === 'anual') {
        const meses = periodo === 'mensual' ? n : n * 12;
        const destino = new Date(d.getFullYear(), d.getMonth() + meses, 1);
        const ultimo = new Date(destino.getFullYear(), destino.getMonth() + 1, 0).getDate();
        destino.setDate(Math.min(d.getDate(), ultimo));
        return destino;
    }
    d.setDate(d.getDate() + n * ((_a = exports.DIAS_PERIODO[periodo]) !== null && _a !== void 0 ? _a : 30));
    return d;
}
function fraccionPrimerPeriodo(entrega, primerPago, periodo) {
    var _a;
    if (primerPago >= sumarPeriodos(entrega, periodo, 1))
        return 1;
    return Math.max(diasEntre(entrega, primerPago), 0) / ((_a = exports.DIAS_PERIODO[periodo]) !== null && _a !== void 0 ? _a : 30);
}
function calcularInteres(e) {
    var _a, _b;
    const porPeriodo = e.capital * (e.tasa / 100);
    const diasDelPeriodo = (_a = exports.DIAS_PERIODO[e.periodo]) !== null && _a !== void 0 ? _a : 30;
    if (e.modalidad === 'interes_corrido' || e.modalidad === 'saldo_decreciente') {
        return { cerrado: false, periodos: 0, interes: 0, total: e.capital, cuota: 0, primeraCuota: 0, porPeriodo };
    }
    if (e.modalidad === 'pago_unico') {
        const periodos = e.desde && e.hasta
            ? Math.max(diasEntre(e.desde, e.hasta), 0) / diasDelPeriodo
            : 0;
        const interes = porPeriodo * periodos;
        const total = e.capital + interes;
        return { cerrado: true, periodos, interes, total, cuota: total, primeraCuota: total, porPeriodo };
    }
    const n = Math.max((_b = e.cuotas) !== null && _b !== void 0 ? _b : 0, 0);
    const primera = e.desde && e.primerPago
        ? fraccionPrimerPeriodo(e.desde, e.primerPago, e.periodo)
        : 1;
    const periodos = n > 0 ? n - 1 + primera : 0;
    const interes = porPeriodo * periodos;
    const total = e.capital + interes;
    if (e.modalidad === 'solo_interes') {
        return {
            cerrado: true, periodos, interes, total,
            cuota: porPeriodo,
            primeraCuota: porPeriodo * primera + (n === 1 ? e.capital : 0),
            porPeriodo,
        };
    }
    const capitalCuota = n > 0 ? e.capital / n : e.capital;
    return {
        cerrado: true,
        periodos,
        interes,
        total,
        cuota: capitalCuota + porPeriodo,
        primeraCuota: capitalCuota + porPeriodo * primera,
        porPeriodo,
    };
}
function redondear(n) {
    const r = Math.round(Number(`${Number(n.toFixed(8))}e2`));
    return Number.isFinite(r) ? r / 100 : n;
}
const hoy = () => {
    const n = new Date();
    return new Date(n.getFullYear(), n.getMonth(), n.getDate());
};
function planDeCuotas(e) {
    var _a, _b, _c, _d;
    const desde = (_a = e.desde) !== null && _a !== void 0 ? _a : hoy();
    if (e.modalidad === 'pago_unico') {
        if (!e.hasta)
            return [];
        const periodos = Math.max(diasEntre(desde, e.hasta), 0) / ((_b = exports.DIAS_PERIODO[e.periodo]) !== null && _b !== void 0 ? _b : 30);
        return [{ numero: 1, vence: e.hasta, capital: e.capital, interes: redondear(e.capital * e.tasa / 100 * periodos) }];
    }
    if (e.modalidad !== 'cuota_fija' && e.modalidad !== 'solo_interes')
        return [];
    const n = Math.floor((_c = e.cuotas) !== null && _c !== void 0 ? _c : 0);
    if (n < 1)
        return [];
    const primerPago = (_d = e.primerPago) !== null && _d !== void 0 ? _d : sumarPeriodos(desde, e.periodo, 1);
    const interesPeriodo = redondear(e.capital * e.tasa / 100);
    const interesPrimera = redondear(e.capital * e.tasa / 100 * fraccionPrimerPeriodo(desde, primerPago, e.periodo));
    const capitalCuota = redondear(e.capital / n);
    return Array.from({ length: n }, (_, k) => {
        const ultima = k === n - 1;
        const capital = e.modalidad === 'solo_interes'
            ? (ultima ? e.capital : 0)
            : (ultima ? redondear(e.capital - capitalCuota * (n - 1)) : capitalCuota);
        return {
            numero: k + 1,
            vence: sumarPeriodos(primerPago, e.periodo, k),
            capital,
            interes: k === 0 ? interesPrimera : interesPeriodo,
        };
    });
}
function estimarSinVencimiento(e, periodos) {
    var _a;
    const n = Math.floor(periodos);
    if (n < 1 || (e.modalidad !== 'interes_corrido' && e.modalidad !== 'saldo_decreciente'))
        return [];
    const desde = (_a = e.desde) !== null && _a !== void 0 ? _a : hoy();
    const abono = redondear(e.capital / n);
    let saldo = e.capital;
    return Array.from({ length: n }, (_, k) => {
        const ultima = k === n - 1;
        const interes = redondear(saldo * e.tasa / 100);
        const capital = e.modalidad === 'interes_corrido'
            ? (ultima ? e.capital : 0)
            : (ultima ? redondear(saldo) : abono);
        if (e.modalidad === 'saldo_decreciente')
            saldo = redondear(saldo - capital);
        return { numero: k + 1, vence: sumarPeriodos(desde, e.periodo, k + 1), capital, interes };
    });
}
function moraDeCuota(monto, tasa, periodo, diasAtraso, diasGracia) {
    var _a;
    return redondear(monto * tasa / 100 / ((_a = exports.DIAS_PERIODO[periodo]) !== null && _a !== void 0 ? _a : 30) * Math.max(diasAtraso - diasGracia, 0));
}
exports.FRECUENCIAS_INTERES = ['diario', 'semanal', 'quincenal', 'mensual'];
const sumaPorDias = (modalidad) => modalidad === 'interes_corrido' || modalidad === 'saldo_decreciente';
exports.sumaPorDias = sumaPorDias;
function repartirAbono(monto, sumado, capital, porSumar) {
    const aSumado = Math.min(monto, Math.max(sumado, 0));
    const aCapital = Math.min(monto - aSumado, Math.max(capital, 0));
    const dias = Math.min(monto - aSumado - aCapital, Math.max(porSumar, 0));
    return { interes: redondear(aSumado + dias), capital: redondear(aCapital), dias: redondear(dias) };
}
function cuotaNivelada(saldo, r, n) {
    if (n < 1)
        return 0;
    return redondear(r > 0 ? saldo * r / (1 - Math.pow(1 + r, -n)) : saldo / n);
}
function fraccionPorDias(entrega, primerPago, periodo) {
    var _a;
    const unPeriodo = sumarPeriodos(entrega, periodo, 1);
    if (diasEntre(unPeriodo, primerPago) === 0)
        return 1;
    return Math.max(diasEntre(entrega, primerPago), 0) / ((_a = exports.DIAS_PERIODO[periodo]) !== null && _a !== void 0 ? _a : 30);
}
  });
  def('catalogos', function (exports, require) {
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.prefijosTelefono = exports.opcionesFrecuenciaInteres = exports.opcionesPeriodo = exports.opcionesMoneda = exports.opcionesPais = exports.nombreMetodo = exports.nombrePais = exports.paises = exports.nombreMoneda = exports.monedas = exports.tiposDocumento = void 0;
exports.monedaDe = monedaDe;
exports.prefijoDe = prefijoDe;
exports.simboloMoneda = simboloMoneda;
const i18n_1 = require("./i18n");
const tipos = ['cedula', 'pasaporte', 'licencia', 'dni', 'otro'];
exports.tiposDocumento = tipos.map((valor) => ({
    valor,
    get etiqueta() { var _a; return (_a = (0, i18n_1.textos)().comun.tiposDocumento[valor]) !== null && _a !== void 0 ? _a : valor; },
}));
exports.monedas = [
    { codigo: 'DOP', simbolo: 'RD$' },
    { codigo: 'USD', simbolo: 'US$' },
    { codigo: 'COP', simbolo: 'COL$' },
    { codigo: 'MXN', simbolo: 'MX$' },
    { codigo: 'ARS', simbolo: 'AR$' },
    { codigo: 'CLP', simbolo: 'CL$' },
    { codigo: 'PEN', simbolo: 'S/' },
    { codigo: 'EUR', simbolo: '€' },
    { codigo: 'VES', simbolo: 'Bs.' },
];
const nombreMoneda = (codigo) => { var _a; return (_a = (0, i18n_1.textos)().comun.monedas[codigo]) !== null && _a !== void 0 ? _a : codigo; };
exports.nombreMoneda = nombreMoneda;
exports.paises = [
    { nombre: 'República Dominicana', telefono: '+1', moneda: 'DOP' },
    { nombre: 'Colombia', telefono: '+57', moneda: 'COP' },
    { nombre: 'Estados Unidos', telefono: '+1', moneda: 'USD' },
    { nombre: 'México', telefono: '+52', moneda: 'MXN' },
    { nombre: 'Argentina', telefono: '+54', moneda: 'ARS' },
    { nombre: 'Chile', telefono: '+56', moneda: 'CLP' },
    { nombre: 'Perú', telefono: '+51', moneda: 'PEN' },
    { nombre: 'Ecuador', telefono: '+593', moneda: 'USD' },
    { nombre: 'España', telefono: '+34', moneda: 'EUR' },
    { nombre: 'Venezuela', telefono: '+58', moneda: 'VES' },
];
const nombrePais = (pais) => { var _a; return pais ? (_a = (0, i18n_1.textos)().comun.paises[pais]) !== null && _a !== void 0 ? _a : pais : ''; };
exports.nombrePais = nombrePais;
const nombreMetodo = (metodo) => { var _a; return metodo ? (_a = (0, i18n_1.textos)().comun.metodosDeposito[metodo]) !== null && _a !== void 0 ? _a : metodo : ''; };
exports.nombreMetodo = nombreMetodo;
exports.opcionesPais = exports.paises.map((p) => ({
    valor: p.nombre,
    get etiqueta() { return (0, exports.nombrePais)(p.nombre); },
}));
exports.opcionesMoneda = exports.monedas.map((m) => ({
    valor: m.codigo,
    get etiqueta() { return `${m.codigo} — ${(0, exports.nombreMoneda)(m.codigo)} (${m.simbolo})`; },
}));
const mayuscula = (s) => s.charAt(0).toUpperCase() + s.slice(1);
exports.opcionesPeriodo = ['diario', 'semanal', 'quincenal', 'mensual', 'anual'].map((valor) => ({
    valor,
    get etiqueta() { var _a; return mayuscula((_a = (0, i18n_1.textos)().comun.periodoFemenino[valor]) !== null && _a !== void 0 ? _a : valor); },
}));
exports.opcionesFrecuenciaInteres = ['diario', 'semanal', 'quincenal', 'mensual'].map((valor) => ({
    valor,
    get etiqueta() { var _a; return mayuscula((_a = (0, i18n_1.textos)().comun.cadaPeriodo[valor]) !== null && _a !== void 0 ? _a : valor); },
}));
exports.prefijosTelefono = [
    ...new Set(exports.paises.map((p) => p.telefono)),
].sort().map((t) => ({ valor: t, etiqueta: t }));
function monedaDe(pais) {
    var _a;
    return (_a = exports.paises.find((p) => p.nombre === pais)) === null || _a === void 0 ? void 0 : _a.moneda;
}
function prefijoDe(pais) {
    var _a;
    return (_a = exports.paises.find((p) => p.nombre === pais)) === null || _a === void 0 ? void 0 : _a.telefono;
}
function simboloMoneda(moneda) {
    var _a, _b, _c;
    return (_c = (_b = (_a = exports.monedas.find((m) => m.codigo === moneda)) === null || _a === void 0 ? void 0 : _a.simbolo) !== null && _b !== void 0 ? _b : moneda) !== null && _c !== void 0 ? _c : '';
}
  });
  def('formato', function (exports, require) {
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.partirTelefono = void 0;
exports.dinero = dinero;
exports.dineroCompacto = dineroCompacto;
exports.montosParejos = montosParejos;
exports.numero = numero;
exports.promedioEstrellas = promedioEstrellas;
exports.leerMonto = leerMonto;
exports.formatearEntrada = formatearEntrada;
exports.leerTasa = leerTasa;
exports.tasaTexto = tasaTexto;
exports.tasaExacta = tasaExacta;
exports.tasaDelPrestamo = tasaDelPrestamo;
exports.periodicidadTexto = periodicidadTexto;
exports.periodosTexto = periodosTexto;
exports.fechaCorta = fechaCorta;
exports.mesAnio = mesAnio;
exports.mesCorto = mesCorto;
exports.aFechaLocal = aFechaLocal;
exports.fechaDeISO = fechaDeISO;
exports.hoyLocal = hoyLocal;
exports.saludo = saludo;
exports.nombreVisible = nombreVisible;
const catalogos_1 = require("../catalogos");
const i18n_1 = require("../i18n");
const interes_1 = require("../interes");
const partirTelefono = (t) => {
    const m = /^(\+\d+)\s*(.*)$/.exec(t !== null && t !== void 0 ? t : '');
    return m ? { prefijo: m[1], numero: m[2] } : { prefijo: '', numero: t !== null && t !== void 0 ? t : '' };
};
exports.partirTelefono = partirTelefono;
const conMiles = (entero, separador) => entero.replace(/\B(?=(\d{3})+(?!\d))/g, separador);
function formatear(n, minDec, maxDec) {
    const [entero, decimales = ''] = Math.abs(n).toFixed(maxDec).split('.');
    let dec = decimales.replace(/0+$/, '');
    if (dec.length < minDec)
        dec = dec.padEnd(minDec, '0');
    const signo = n < 0 && (Number(entero) > 0 || Number(dec) > 0) ? '-' : '';
    return signo + conMiles(entero, ',') + (dec ? '.' + dec : '');
}
function dinero(monto, moneda, decimales) {
    const n = Number(monto !== null && monto !== void 0 ? monto : 0);
    const conCentavos = decimales != null ? decimales === 2 : !Number.isInteger(n);
    const simbolo = (0, catalogos_1.simboloMoneda)(moneda) || '$';
    return `${simbolo}${formatear(n, conCentavos ? 2 : 0, 2)}`;
}
function dineroCompacto(monto, moneda) {
    const n = Number(monto !== null && monto !== void 0 ? monto : 0);
    const simbolo = (0, catalogos_1.simboloMoneda)(moneda) || '$';
    const a = Math.abs(n);
    const [valor, sufijo] = a >= 1e6 ? [n / 1e6, 'M'] : a >= 1e3 ? [n / 1e3, 'K'] : [n, ''];
    return `${simbolo}${formatear(valor, 0, sufijo && Math.abs(valor) < 10 ? 1 : 0)}${sufijo}`;
}
function montosParejos(montos) {
    const algunoConCentavos = montos.some((m) => !Number.isInteger(Number(m.monto)));
    return montos.map((m) => dinero(m.monto, m.moneda, algunoConCentavos ? 2 : 0));
}
function numero(n, decimales = 1) {
    return formatear(n, 0, decimales);
}
function promedioEstrellas(n) {
    return formatear(n, 1, 1);
}
function leerMonto(texto) {
    const limpio = texto.replace(/[^\d.,]/g, '');
    if (!/\d/.test(limpio))
        return NaN;
    const ultimo = Math.max(limpio.lastIndexOf('.'), limpio.lastIndexOf(','));
    const cifrasDespues = ultimo < 0 ? 0 : limpio.length - ultimo - 1;
    if (ultimo >= 0 && cifrasDespues >= 1 && cifrasDespues <= 2) {
        return Number(`${limpio.slice(0, ultimo).replace(/[.,]/g, '')}.${limpio.slice(ultimo + 1)}`);
    }
    return Number(limpio.replace(/[.,]/g, ''));
}
function formatearEntrada(texto, tipo = 'monto') {
    let s = (texto !== null && texto !== void 0 ? texto : '').replace(/[^\d.,]/g, '');
    if (!s)
        return '';
    if (!s.includes('.')) {
        if (tipo === 'tasa')
            s = s.replace(/,(?=[^,]*$)/, '.');
        else if (s.endsWith(','))
            s = `${s.slice(0, -1)}.`;
    }
    const punto = s.indexOf('.');
    const entero = (punto < 0 ? s : s.slice(0, punto)).replace(/[.,]/g, '').replace(/^0+(?=\d)/, '');
    const dec = punto < 0 ? null : s.slice(punto + 1).replace(/[.,]/g, '').slice(0, tipo === 'tasa' ? 4 : 2);
    const base = entero || (dec != null ? '0' : '');
    const conSeparadores = tipo === 'tasa' ? base : conMiles(base, ',');
    return dec == null ? conSeparadores : `${conSeparadores}.${dec}`;
}
function leerTasa(texto) {
    const limpio = texto.replace(/[^\d.,]/g, '');
    if (!/\d/.test(limpio))
        return NaN;
    const ultimo = Math.max(limpio.lastIndexOf('.'), limpio.lastIndexOf(','));
    if (ultimo < 0)
        return Number(limpio);
    return Number(`${limpio.slice(0, ultimo).replace(/[.,]/g, '')}.${limpio.slice(ultimo + 1)}`);
}
function tasaTexto(tasa, periodo) {
    var _a;
    const p = periodo !== null && periodo !== void 0 ? periodo : 'mensual';
    return `${numero(Number(tasa), 2)}% ${(_a = (0, i18n_1.textos)().comun.periodoFemenino[p]) !== null && _a !== void 0 ? _a : p}`;
}
function tasaExacta(tasa, periodo) {
    var _a;
    const p = periodo !== null && periodo !== void 0 ? periodo : 'mensual';
    return `${numero(Number(tasa), 4)}% ${(_a = (0, i18n_1.textos)().comun.periodoFemenino[p]) !== null && _a !== void 0 ? _a : p}`;
}
function tasaDelPrestamo(p) {
    var _a, _b, _c;
    const base = tasaTexto(p.tasa, p.periodo);
    if (!p.periodo_tasa_escrita || p.periodo_tasa_escrita === p.periodo)
        return base;
    const anual = Number(p.tasa) * ((_b = interes_1.PERIODOS_ANIO[(_a = p.periodo) !== null && _a !== void 0 ? _a : 'mensual']) !== null && _b !== void 0 ? _b : 12);
    return `${base} (${tasaTexto(anual / ((_c = interes_1.PERIODOS_ANIO[p.periodo_tasa_escrita]) !== null && _c !== void 0 ? _c : 12), p.periodo_tasa_escrita)})`;
}
function periodicidadTexto(periodo) {
    var _a, _b;
    const t = (_b = (_a = (0, i18n_1.textos)().comun.periodoFemenino[periodo !== null && periodo !== void 0 ? periodo : 'mensual']) !== null && _a !== void 0 ? _a : periodo) !== null && _b !== void 0 ? _b : '';
    return t.charAt(0).toUpperCase() + t.slice(1);
}
function periodosTexto(n, periodo) {
    var _a;
    const c = (0, i18n_1.textos)().comun;
    return ((_a = c.periodos[periodo !== null && periodo !== void 0 ? periodo : 'mensual']) !== null && _a !== void 0 ? _a : c.meses)(n);
}
function fechaCorta(iso) {
    return aFechaLocal(iso).toLocaleDateString((0, i18n_1.localeActual)(), { day: 'numeric', month: 'short', year: 'numeric' });
}
function mesAnio(iso) {
    return aFechaLocal(iso).toLocaleDateString((0, i18n_1.localeActual)(), { month: 'short', year: 'numeric' });
}
function mesCorto(iso) {
    return aFechaLocal(iso).toLocaleDateString((0, i18n_1.localeActual)(), { month: 'short' });
}
function aFechaLocal(iso) {
    const soloFecha = /^\d{4}-\d{2}-\d{2}$/.exec(iso);
    if (!soloFecha)
        return new Date(iso);
    const [a, m, d] = iso.split('-').map(Number);
    return new Date(a, m - 1, d);
}
function fechaDeISO(iso) {
    const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso.trim());
    if (!m)
        return null;
    const d = new Date(+m[1], +m[2] - 1, +m[3]);
    return d.getFullYear() === +m[1] && d.getMonth() === +m[2] - 1 && d.getDate() === +m[3] ? d : null;
}
function hoyLocal() {
    const n = new Date();
    return new Date(n.getFullYear(), n.getMonth(), n.getDate());
}
function saludo() {
    const h = new Date().getHours();
    const t = (0, i18n_1.textos)().comun.saludo;
    if (h < 12)
        return t.manana;
    if (h < 19)
        return t.tarde;
    return t.noche;
}
const MARCA_ELIMINADA = ' (cuenta eliminada)';
function nombreVisible(nombre) {
    if (!nombre)
        return (0, i18n_1.textos)().comun.sinDato;
    return nombre.endsWith(MARCA_ELIMINADA)
        ? `${nombre.slice(0, -MARCA_ELIMINADA.length)} (${(0, i18n_1.textos)().comun.cuentaEliminada})`
        : nombre;
}
  });
  def('propios', function (exports, require) {
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.vencePropia = void 0;
exports.planPropio = planPropio;
const interes_1 = require("./interes");
const aFecha = (iso) => {
    const [a, m, d] = iso.slice(0, 10).split('-').map(Number);
    return new Date(a, m - 1, d);
};
const aISO = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
const vencePropia = (p, numero) => aISO((0, interes_1.sumarPeriodos)(aFecha(p.primer_pago), p.periodo_pago, numero - 1));
exports.vencePropia = vencePropia;
const porFecha = (a, b) => a.fecha < b.fecha ? -1 : a.fecha > b.fecha ? 1 : a.creado_en < b.creado_en ? -1 : 1;
function planPropio(p, pagos, tasas, hoy) {
    var _a, _b, _c;
    const n = Number(p.num_cuotas);
    const capitalInicial = Number(p.capital);
    const cambios = [...tasas].sort((a, b) => a.desde_cuota - b.desde_cuota);
    const tasaDe = (k) => { var _a, _b; return Number((_b = (_a = cambios.filter((c) => c.desde_cuota <= k).at(-1)) === null || _a === void 0 ? void 0 : _a.tasa) !== null && _b !== void 0 ? _b : p.tasa); };
    const fraccion = (0, interes_1.fraccionPorDias)(aFecha(p.entregado), aFecha(p.primer_pago), p.periodo_pago);
    const abonos = pagos.filter((x) => x.tipo === 'abono').sort(porFecha);
    const deCuota = new Map(pagos.filter((x) => x.tipo === 'cuota').map((x) => [Number(x.cuota), x]));
    const cuotas = [];
    let saldo = capitalInicial;
    let siguienteAbono = 0;
    let rehacer = true;
    let tasaUsada = NaN;
    let cuota = 0;
    let capitalFijo = 0;
    let base = capitalInicial;
    for (let k = 1; k <= n; k++) {
        const vence = (0, exports.vencePropia)(p, k);
        while (siguienteAbono < abonos.length && abonos[siguienteAbono].fecha < vence) {
            saldo = (0, interes_1.redondear)(Math.max(saldo - Number(abonos[siguienteAbono].monto), 0));
            siguienteAbono++;
            rehacer = true;
        }
        if (saldo <= 0)
            break;
        const tasa = tasaDe(k);
        const r = (0, interes_1.convertirTasa)(tasa, p.periodo_tasa, p.periodo_pago) / 100;
        if (r !== tasaUsada && p.sistema === 'nivelada')
            rehacer = true;
        tasaUsada = r;
        if (rehacer) {
            const quedan = n - k + 1;
            cuota = (0, interes_1.cuotaNivelada)(saldo, r, quedan);
            capitalFijo = (0, interes_1.redondear)(saldo / quedan);
            base = saldo;
            rehacer = false;
        }
        const sobre = p.sistema === 'nivelada' ? saldo : base;
        const interesPeriodo = (0, interes_1.redondear)(sobre * r);
        const capital = k === n
            ? saldo
            : (0, interes_1.redondear)(Math.min(Math.max(p.sistema === 'nivelada' ? cuota - interesPeriodo : capitalFijo, 0), saldo));
        const interes = k === 1 && fraccion !== 1 ? (0, interes_1.redondear)(sobre * r * fraccion) : interesPeriodo;
        saldo = (0, interes_1.redondear)(saldo - capital);
        const pago = (_a = deCuota.get(k)) !== null && _a !== void 0 ? _a : null;
        cuotas.push({
            numero: k,
            vence,
            capital,
            interes,
            total: (0, interes_1.redondear)(capital + interes),
            saldo,
            tasa,
            pago,
            estado: pago ? 'pagada' : vence < hoy ? 'vencida' : 'pendiente',
        });
    }
    const sinPagar = cuotas.filter((c) => !c.pago);
    const proxima = (_b = sinPagar[0]) !== null && _b !== void 0 ? _b : null;
    const capitalPagado = cuotas.filter((c) => c.pago).reduce((s, c) => s + c.capital, 0)
        + abonos.reduce((s, a) => s + Number(a.monto), 0);
    return {
        cuotas,
        capitalPendiente: (0, interes_1.redondear)(Math.max(capitalInicial - capitalPagado, 0)),
        falta: (0, interes_1.redondear)(sinPagar.reduce((s, c) => s + c.total, 0)),
        pagado: (0, interes_1.redondear)(pagos.reduce((s, x) => s + Number(x.monto), 0)),
        interesTotal: (0, interes_1.redondear)(cuotas.reduce((s, c) => s + c.interes, 0)),
        proxima,
        tasaVigente: tasaDe((_c = proxima === null || proxima === void 0 ? void 0 : proxima.numero) !== null && _c !== void 0 ? _c : n),
        estado: proxima ? 'activo' : 'pagado',
    };
}
  });
  return mods;
})();
// La calculadora de prestalink.app, en el navegador. scripts/sitio/motor.mjs le pone
// delante el cálculo de la app (src/interes.ts, src/propios.ts y src/lib/formato.ts,
// compilados tal cual): aquí solo está la pantalla, la misma idea que
// app/calculadora.tsx. CALC son los textos de la página y MOTOR, el cálculo.
//
// No propone ninguna tasa: los campos empiezan vacíos, como en la app (Términos).
// No manda nada a ningún lado: todo se calcula en el teléfono de quien la usa.
(function () {
  const $ = (id) => document.getElementById(id);
  const form = $('calc');
  if (!form) return;
  const { interes, propios, formato } = MOTOR;

  // Los mismos topes de la app: para que un dedazo no arme miles de filas.
  const MAX_CUOTAS = 1825;
  const MAX_DIAS = 3650;
  const FILAS = 12;
  // Cómo se mide el plazo de cada tipo.
  const PLAZO = {
    cuota_fija: 'cuotas', nivelada: 'cuotas', solo_interes: 'cuotas',
    pago_unico: 'dias', interes_corrido: 'periodos', saldo_decreciente: 'periodos',
  };
  const CON_MORA = { cuota_fija: 1, nivelada: 1, solo_interes: 1, pago_unico: 1 };
  // Cada tipo pide su plazo; se guardan aparte para no perderlos al cambiar.
  const plazos = { cuotas: '', dias: '', periodos: '' };
  let entero = false;
  let pagoElegido = false;
  let compartir = '';

  const t = CALC.textos;
  const hoy = () => { const n = new Date(); return new Date(n.getFullYear(), n.getMonth(), n.getDate()); };
  const enDias = (d, n) => { const r = new Date(d.getTime()); r.setDate(r.getDate() + n); return r; };
  const iso = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  const numero = (texto, max) => Math.min(Math.floor(Number(String(texto).replace(/\D/g, '')) || 0), max);
  const tipoActual = () => form.querySelector('input[name=tipo]:checked').value;
  const poner = (frase, datos) => Object.keys(datos).reduce((s, k) => s.split(`{${k}}`).join(datos[k]), frase);
  const el = (etiqueta, clase, texto) => {
    const e = document.createElement(etiqueta);
    if (clase) e.className = clase;
    if (texto != null) e.textContent = texto;
    return e;
  };

  // Las filas del plan, con la forma de la app: número, fecha, capital e interés.
  function plan(d) {
    if (!(d.capital > 0) || !(d.tasa >= 0)) return [];
    const desde = hoy();
    if (d.tipo === 'nivelada') {
      if (d.cuotas < 1) return [];
      return propios.planPropio({
        id: '', entidad: '', moneda: d.moneda, capital: d.capital, sistema: 'nivelada',
        tasa: d.tasa, periodo_tasa: d.periodo, periodo_pago: d.pago, num_cuotas: d.cuotas,
        entregado: iso(desde), primer_pago: iso(interes.sumarPeriodos(desde, d.pago, 1)),
        tasa_variable: false, notas: null, creado_en: '',
      }, [], [], iso(desde)).cuotas.map((c) => ({
        numero: c.numero, vence: formato.aFechaLocal(c.vence), capital: c.capital, interes: c.interes,
      }));
    }
    const entrada = {
      capital: d.capital, tasa: d.tasaPago, periodo: d.pago, modalidad: d.tipo, cuotas: d.cuotas,
      desde, hasta: d.dias > 0 ? enDias(desde, d.dias) : null,
    };
    return PLAZO[d.tipo] === 'periodos' ? interes.estimarSinVencimiento(entrada, d.periodos) : interes.planDeCuotas(entrada);
  }

  function leer() {
    const tipo = tipoActual();
    const periodo = $('periodo').value;
    const pago = PLAZO[tipo] === 'cuotas' ? $('pago').value : periodo;
    const tasa = formato.leerTasa($('tasa').value);
    return {
      tipo, periodo, pago, tasa,
      moneda: $('moneda').value,
      capital: formato.leerMonto($('monto').value) || 0,
      tasaPago: interes.convertirTasa(tasa, periodo, pago),
      cuotas: numero(plazos.cuotas, MAX_CUOTAS),
      dias: numero(plazos.dias, MAX_DIAS),
      periodos: numero(plazos.periodos, MAX_CUOTAS),
    };
  }

  function campos(d) {
    const clase = PLAZO[d.tipo];
    const variosPeriodos = t.varios[d.periodo];
    $('plazo-etiqueta').textContent = clase === 'cuotas' ? t.cuotas : clase === 'dias' ? t.dias : poner(t.periodosHasta, { periodos: variosPeriodos });
    if ($('plazo').value !== plazos[clase]) $('plazo').value = plazos[clase];
    $('tipo-nota').textContent = t.notas[d.tipo];
    $('campo-pago').hidden = clase !== 'cuotas';
    $('mora').hidden = !CON_MORA[d.tipo];
    const otra = clase === 'cuotas' && d.pago !== d.periodo && d.tasa > 0 && d.tipo !== 'nivelada';
    $('equivale').hidden = !otra;
    if (otra) {
      $('equivale').textContent = poner(t.equivale, {
        escrita: formato.tasaExacta(d.tasa, d.periodo), pago: formato.tasaExacta(d.tasaPago, d.pago),
      });
    }
  }

  function fila(etiqueta, valor, fuerte) {
    const f = el('div', fuerte ? 'renglon fuerte' : 'renglon');
    f.appendChild(el('span', '', etiqueta));
    f.appendChild(el('strong', '', valor));
    return f;
  }

  function pintar() {
    const d = leer();
    campos(d);
    const filas = plan(d);
    const hay = filas.length > 0;
    $('vacio').hidden = hay;
    $('resultado').hidden = !hay;
    $('plan').hidden = !hay || filas.length < 2;
    if (!hay) return;

    const decimales = filas.some((c) => !Number.isInteger(c.capital) || !Number.isInteger(c.interes)) ? 2 : 0;
    const plata = (n) => formato.dinero(n, d.moneda, decimales);
    const monto = (c) => c.capital + c.interes;
    const interesTotal = interes.redondear(filas.reduce((s, c) => s + c.interes, 0));
    const total = interes.redondear(filas.reduce((s, c) => s + monto(c), 0));
    const primera = filas[0];
    const ultima = filas[filas.length - 1];
    const regular = filas[Math.min(1, filas.length - 1)];
    const iguales = filas.every((c) => Math.abs(monto(c) - monto(primera)) < 0.05);

    $('total').textContent = plata(total);
    $('total-etiqueta').textContent = PLAZO[d.tipo] === 'periodos' ? t.totalEstimado : t.total;
    const caja = $('renglones');
    caja.textContent = '';
    if (filas.length > 1) {
      if (iguales) caja.appendChild(fila(t.cuota, `${filas.length} × ${plata(monto(primera))}`, true));
      else {
        caja.appendChild(fila(t.primera, plata(monto(primera)), true));
        caja.appendChild(fila(t.ultima, plata(monto(ultima)), true));
      }
    }
    caja.appendChild(fila(t.capital, plata(d.capital)));
    caja.appendChild(fila(t.interes, plata(interesTotal)));
    caja.appendChild(fila(t.vence, formato.fechaCorta(iso(ultima.vence))));

    // La mora de una cuota pagada tarde.
    const tasaMora = formato.leerTasa($('mora-tasa').value) || 0;
    const atraso = numero($('mora-atraso').value, MAX_DIAS);
    const conMora = CON_MORA[d.tipo] && tasaMora > 0 && atraso > 0;
    $('mora-resultado').hidden = !conMora;
    if (conMora) {
      const mora = interes.moraDeCuota(monto(regular), interes.convertirTasa(tasaMora, d.periodo, d.pago), d.pago, atraso, numero($('mora-gracia').value, 365));
      const dec = Number.isInteger(mora) ? decimales : 2;
      $('mora-resultado').textContent = poner(t.moraFrase, {
        cuota: formato.dinero(monto(regular), d.moneda, dec), dias: String(atraso),
        mora: formato.dinero(mora, d.moneda, dec), total: formato.dinero(monto(regular) + mora, d.moneda, dec),
      });
    }

    // El plan, cuota por cuota.
    const cuerpo = $('filas');
    cuerpo.textContent = '';
    let saldo = d.capital;
    filas.forEach((c, i) => {
      saldo = interes.redondear(saldo - c.capital);
      if (!entero && i >= FILAS) return;
      const tr = el('tr');
      [String(c.numero), formato.fechaCorta(iso(c.vence)), plata(c.capital), plata(c.interes), plata(monto(c)), plata(Math.max(saldo, 0))]
        .forEach((v) => tr.appendChild(el('td', '', v)));
      cuerpo.appendChild(tr);
    });
    $('ver-todas').hidden = filas.length <= FILAS;
    $('ver-todas').textContent = entero ? t.verMenos : poner(t.verTodas, { n: String(filas.length) });

    const nombreTipo = form.querySelector('input[name=tipo]:checked').parentNode.textContent.trim();
    compartir = [
      `${plata(d.capital)} · ${nombreTipo} · ${formato.tasaExacta(d.tasa, d.periodo)}`,
      filas.length > 1 ? (iguales ? `${t.cuota}: ${filas.length} × ${plata(monto(primera))}` : `${t.primera}: ${plata(monto(primera))} · ${t.ultima}: ${plata(monto(ultima))}`) : '',
      `${$('total-etiqueta').textContent}: ${plata(total)} (${t.interes}: ${plata(interesTotal)})`,
      CALC.direccion,
    ].filter(Boolean).join('\n');
    $('whatsapp').href = `https://wa.me/?text=${encodeURIComponent(compartir)}`;
  }

  // Los campos: con comas de miles mientras se escribe, como en la app.
  const alEscribir = (id, tipo) => $(id).addEventListener('input', () => {
    $(id).value = formato.formatearEntrada($(id).value, tipo);
    pintar();
  });
  alEscribir('monto', 'monto');
  alEscribir('tasa', 'tasa');
  alEscribir('mora-tasa', 'tasa');
  ['mora-atraso', 'mora-gracia'].forEach((id) => $(id).addEventListener('input', () => {
    $(id).value = $(id).value.replace(/\D/g, '').slice(0, 4);
    pintar();
  }));
  $('plazo').addEventListener('input', () => {
    $('plazo').value = $('plazo').value.replace(/\D/g, '').slice(0, 4);
    plazos[PLAZO[tipoActual()]] = $('plazo').value;
    entero = false;
    pintar();
  });
  $('pago').addEventListener('change', () => { pagoElegido = true; pintar(); });
  $('periodo').addEventListener('change', () => {
    // Sin elegir otra cosa, se paga al ritmo de la tasa.
    if (!pagoElegido) $('pago').value = $('periodo').value;
    pintar();
  });
  $('moneda').addEventListener('change', pintar);
  form.querySelectorAll('input[name=tipo]').forEach((r) => r.addEventListener('change', () => { entero = false; pintar(); }));
  form.addEventListener('submit', (e) => e.preventDefault());
  $('ver-todas').addEventListener('click', () => { entero = !entero; pintar(); });
  $('copiar').addEventListener('click', () => {
    const listo = () => {
      $('copiar').textContent = t.copiado;
      setTimeout(() => { $('copiar').textContent = t.copiar; }, 1800);
    };
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(compartir).then(listo, () => {});
  });

  // Al volver atrás, el navegador repone lo escrito: se lee de ahí.
  plazos[PLAZO[tipoActual()]] = $('plazo').value.replace(/\D/g, '');
  if ($('pago').value !== $('periodo').value) pagoElegido = true;
  pintar();
})();

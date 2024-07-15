// TODO(developer): Set to client ID and API key from the Developer Console
const CLIENT_ID =
	"565284801595-ebbhgd4esnt7tlkcng3k7crqeg9c0v1d.apps.googleusercontent.com";
const API_KEY = "AIzaSyALpjEYnfTXugz1D_uIiVcuIWcU91oSRnU";

// Discovery doc URL for APIs used by the quickstart
const DISCOVERY_DOC =
	"https://sheets.googleapis.com/$discovery/rest?version=v4";

// Authorization scopes required by the API; multiple scopes can be
// included, separated by spaces.
const SCOPES = "https://www.googleapis.com/auth/spreadsheets.readonly";

// TODO(developer): Set to client ID and API key from the Developer Console
const btnAuthorized = document.querySelector("#authorize_button");
const btnSignOut = document.querySelector("#signout_button");
const scripts = document.querySelectorAll("script");
const divsRecibos = document.querySelector(".recibos");
const btnExportToPdf = document.querySelector("#export-pdf");
const formAddRecibo = document.querySelector("#manual-entry-form");
const btnTogglePdfs = document.querySelector("#toggle-pdfs");
const btnDeletePdfs = document.querySelector("#reset-pdf");

const days = [
	"LUNES",
	"MARTES",
	"MIERCOLES",
	"JUEVES",
	"VIERNES",
	"SABADO",
	"DOMINGO",
];

scripts[1].addEventListener("load", gapiLoaded);
scripts[2].addEventListener("load", gisLoaded);

btnAuthorized.addEventListener("click", handleAuthClick);
btnSignOut.addEventListener("click", handleSignoutClick);

let tokenClient;
let gapiInited = false;
let gisInited = false;
let globalDate;
let count = 0;

document.getElementById("authorize_button").style.visibility = "hidden";
document.getElementById("signout_button").style.visibility = "hidden";

/**
 * Callback after api.js is loaded.
 */
function gapiLoaded() {
	gapi.load("client", initializeGapiClient);
}

/**
 * Callback after the API client is loaded. Loads the
 * discovery doc to initialize the API.
 */
async function initializeGapiClient() {
	await gapi.client.init({
		apiKey: API_KEY,
		discoveryDocs: [DISCOVERY_DOC],
	});
	gapiInited = true;
	maybeEnableButtons();
}

/**
 * Callback after Google Identity Services are loaded.
 */
function gisLoaded() {
	tokenClient = google.accounts.oauth2.initTokenClient({
		client_id: CLIENT_ID,
		scope: SCOPES,
		callback: "", // defined later
	});
	gisInited = true;
	maybeEnableButtons();
}

/**
 * Enables user interaction after all libraries are loaded.
 */
function maybeEnableButtons() {
	if (gapiInited && gisInited) {
		document.getElementById("authorize_button").style.visibility = "visible";
	}
}

/**
 *  Sign in the user upon button click.
 */
function handleAuthClick() {
	tokenClient.callback = async resp => {
		if (resp.error !== undefined) {
			throw resp;
		}
		document.getElementById("signout_button").style.visibility = "visible";
		document.getElementById("authorize_button").innerText = "Refresh";
		await listMajors();
	};

	if (gapi.client.getToken() === null) {
		// Prompt the user to select a Google Account and ask for consent to share their data
		// when establishing a new session.
		tokenClient.requestAccessToken({ prompt: "consent" });
	} else {
		// Skip display of account chooser and consent dialog for an existing session.
		tokenClient.requestAccessToken({ prompt: "" });
	}
}

/**
 *  Sign out the user upon button click.
 */
function handleSignoutClick() {
	const token = gapi.client.getToken();
	if (token !== null) {
		google.accounts.oauth2.revoke(token.access_token);
		gapi.client.setToken("");
		document.getElementById("content").innerText = "";
		document.getElementById("authorize_button").innerText = "Authorize";
		document.getElementById("signout_button").style.visibility = "hidden";
	}
}

/**
 * Print the names and majors of students in a sample spreadsheet:
 * https://docs.google.com/spreadsheets/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms/edit
 */
async function listMajors() {
	let response;
	try {
		response = await gapi.client.sheets.spreadsheets.values.get({
			spreadsheetId: "1R2u3nzGsael5fHU_b83O31dO_JQVlUtIz4CEjWrqFsc",
			range: "sueldos!A:G",
		});
	} catch (err) {
		document.getElementById("content").innerText = err.message;
		return;
	}
	const range = response.result;
	if (!range || !range.values || range.values.length == 0) {
		document.getElementById("content").innerText = "No values found.";
		return;
	}

	// console.log(range.values);
	globalDate = range.values[0][2];
	range.values
		.filter(e => !!e[0] === true && !!e[1] === true && !!e[6] === true)
		.forEach((recibo, index) => {
			if (index === 0 || index === 1) return;
			count++;
			if (count % 4 === 0) {
				divsRecibos.innerHTML += `
			<div class="recibo html2pdf__page-break">
				<h4>RECIBO DE PAGO</h4>
				<p><b>Fecha:</b> ${range.values[0][1]} ${globalDate}</p>
				<p><b>Nombre:</b> ${recibo[0]}</p>
				<p><b>Recibi de:</b> DESENCHUFADOS S.R.L</p>
				<p><b>Monto:</b> $ ${Number(recibo[6])} ${numberToWords(
					recibo[6]
				).toUpperCase()} PESOS</p>
				<p><b>En concepto de:</b> ${recibo[1]} ${recibo[4]} ${
					!recibo[4] ? "" : "hs"
				}</p>
				<p>Firma:</p>
				<p>Aclaración:</p>
				<p>DNI:</p>
			</div>
			`;
			} else {
				divsRecibos.innerHTML += `
				<div class="recibo">
				<h4>RECIBO DE PAGO</h4>
				<p><b>Fecha:</b> ${range.values[0][1]} ${globalDate}</p>
				<p><b>Nombre:</b> ${recibo[0]}</p>
				<p><b>Recibi de:</b> DESENCHUFADOS S.R.L</p>
				<p><b>Monto:</b> $ ${Number(recibo[6])} ${numberToWords(
					recibo[6]
				).toUpperCase()} PESOS</p>
				<p><b>En concepto de:</b> ${recibo[1]} ${recibo[4]} ${
					!recibo[4] ? "" : "hs"
				}</p>
				<p>Firma:</p>
				<p>Aclaración:</p>
				<p>DNI:</p>
			</div>
			`;
			}
		});
}

btnTogglePdfs.addEventListener("click", event => {
	const clases = btnTogglePdfs.querySelector("i").classList;
	if (clases.contains("fa-eye-slash")) {
		btnTogglePdfs.innerHTML = `<i class="fa-solid fa-eye"></i>`;
		divsRecibos.setAttribute("hidden", true);
		btnExportToPdf.setAttribute("disabled", true);
	} else {
		btnTogglePdfs.innerHTML = `<i class="fa-solid fa-eye-slash"></i>`;
		divsRecibos.removeAttribute("hidden");
		btnExportToPdf.removeAttribute("disabled");
	}
});

btnDeletePdfs.addEventListener("click", () => {
	const dialog = document.querySelector("#delete-dialog");
	dialog.showModal();
	dialog.querySelector("span").addEventListener("click", () => {
		dialog.close();
	});
	dialog.querySelector("button").addEventListener("click", () => {
		divsRecibos.innerHTML = "";
		dialog.close();
	});
});

btnExportToPdf.addEventListener("click", () => {
	const options = {
		margin: 2,
		filename: "recibos.pdf",
		html2canvas: { scale: 1 },
		jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
	};

	html2pdf()
		.set(options)
		.from(divsRecibos, "element")
		.save()
		.catch(error => console.error(error))
		.finally(console.log("aca deberian tener los recibos display none"));
});

formAddRecibo.addEventListener("submit", event => {
	event.preventDefault();
	const day = days[new Date(event.target.fecha.value).getDay()];
	const numOfCopys = event.target.copys.value;
	if (numOfCopys && numOfCopys > 1) {
		for (let i = 0; i < numOfCopys; i++) {
			count++;
			divsRecibos.innerHTML += `
				<div class="recibo ${count % 4 === 0 ? "html2pdf__page-break" : ""}">
				<h4>RECIBO DE PAGO</h4>
				<p><b>Fecha:</b> ${day} ${event.target.fecha.value
				.split("-")
				.reverse()
				.join("/")}</p>
				<p><b>Nombre:</b> ${event.target.nombre.value.toUpperCase()}</p>
				<p><b>Recibi de:</b> DESENCHUFADOS S.R.L</p>
				<p><b>Monto:</b> $ ${event.target.monto.value} ${numberToWords(
				event.target.monto.value
			).toUpperCase()} PESOS</p>
				<p><b>En concepto de:</b> ${event.target.concepto.value.toUpperCase()}</p>
				<p>Firma:</p>
				<p>Aclaración:</p>
				<p>DNI:</p>
			</div>
			`;
		}
	} else {
		count++;
		divsRecibos.innerHTML += `
				<div class="recibo ${count % 4 === 0 ? "html2pdf__page-break" : ""}">
				<h4>RECIBO DE PAGO</h4>
				<p><b>Fecha: </b>${day} ${event.target.fecha.value
			.split("-")
			.reverse()
			.join("/")}</p>
				<p><b>Nombre:</b> ${event.target.nombre.value.toUpperCase()}</p>
				<p><b>Recibi de:</b> DESENCHUFADOS S.R.L</p>
				<p><b>Monto:</b> $ ${event.target.monto.value} ${numberToWords(
			event.target.monto.value
		).toUpperCase()} PESOS</p>
				<p><b>En concepto de:</b> ${event.target.concepto.value.toUpperCase()}</p>
				<p>Firma:</p>
				<p>Aclaración:</p>
				<p>DNI:</p>
			</div>
			`;
	}
	event.target.reset();
});

function numberToWords(str) {
	let num = str;
	const unidades = [
		"cero",
		"uno",
		"dos",
		"tres",
		"cuatro",
		"cinco",
		"seis",
		"siete",
		"ocho",
		"nueve",
	];
	const decenas = [
		"diez",
		"once",
		"doce",
		"trece",
		"catorce",
		"quince",
		"dieciséis",
		"diecisiete",
		"dieciocho",
		"diecinueve",
	];
	const decenas2 = [
		"veinte",
		"treinta",
		"cuarenta",
		"cincuenta",
		"sesenta",
		"setenta",
		"ochenta",
		"noventa",
	];
	const centenas = [
		"cien",
		"doscientos",
		"trescientos",
		"cuatrocientos",
		"quinientos",
		"seiscientos",
		"setecientos",
		"ochocientos",
		"novecientos",
	];

	if (num < 10) {
		return unidades[num];
	} else if (num < 20) {
		return decenas[num - 10];
	} else if (num < 100) {
		const unidad = num % 10;
		const decena = Math.floor(num / 10);
		return decena === 2
			? unidad
				? "veinti" + unidades[unidad]
				: decenas2[decena - 2]
			: unidad
			? decenas2[decena - 2] + " y " + unidades[unidad]
			: decenas2[decena - 2];
	} else if (num < 1000) {
		const unidad = num % 100;
		const centena = Math.floor(num / 100);
		return centena === 1
			? unidad
				? "ciento " + numberToWords(unidad)
				: centenas[centena - 1]
			: unidad
			? centenas[centena - 1] + " " + numberToWords(unidad)
			: centenas[centena - 1];
	} else if (num < 1000000) {
		const miles = Math.floor(num / 1000);
		const resto = num % 1000;
		return miles === 1
			? "mil" + (resto ? " " + numberToWords(resto) : "")
			: numberToWords(miles) +
					" mil" +
					(resto ? " " + numberToWords(resto) : "");
	} else if (num < 1000000000) {
		const millones = Math.floor(num / 1000000);
		const resto = num % 1000000;
		return millones === 1
			? "un millón" + (resto ? " " + numberToWords(resto) : "")
			: numberToWords(millones) +
					" millones" +
					(resto ? " " + numberToWords(resto) : "");
	}

	return num.toString();
}

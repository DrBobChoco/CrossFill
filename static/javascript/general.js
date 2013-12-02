// General Functions

function getURLId() {
	var urlBits = document.location.pathname.split('/');
	return urlBits[urlBits.length - 1]
}

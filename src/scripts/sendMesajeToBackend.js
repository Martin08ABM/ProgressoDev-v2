const submitButton = document.getElementById("submitButton");
const divRespuesta = document.getElementById("divRespuesta");
const inputText = document.getElementById("input-text");

inputText.value = inputText.value.toLowerCase();

submitButton.addEventListener('click', async () => {
    console.log("Chavales esto funciona");

    if (!inputText.value.trim()) {
        alert("Por favor escribe un mensaje antes de enviar");
        return;
    }

    try {
        const respuesta = await fetch("/api/answer", {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                prompt: inputText.value,
            })
        });

        let data;
        const contentType = respuesta.headers.get("content-type");

        if (contentType && contentType.includes("application/json")) {
            data = await respuesta.json();
        } else {
            const textoRespuesta = await respuesta.text();
            throw new Error(`Respuesta no es JSON. Contenido recibido:\n${textoRespuesta}`);
        }

        if (respuesta.ok) {
            divRespuesta.innerHTML = '';

            if (data[0]?.tipo === 'imagen' && typeof data[0].contenido === 'string') {
                const imgElement = document.createElement('img');
                imgElement.src = data[0].contenido;
                imgElement.alt = 'Roadmap generado';
                divRespuesta.appendChild(imgElement);
            } else if (data[0]?.tipo === 'texto' && typeof data[0].contenido === 'string') {
                const parrafo = document.createElement('p');
                parrafo.textContent = data[0].contenido;
                divRespuesta.appendChild(parrafo);
            } else {
                const mensajeError = document.createElement('p');
                mensajeError.textContent = 'Formato de respuesta inesperado';
                divRespuesta.appendChild(mensajeError);
            }
        } else {
            throw new Error(data?.error || 'Error en la respuesta del servidor');
        }

    } catch (error) {
        console.error('Error:', error);
        divRespuesta.innerHTML = `<p class="text-red-500">Error: ${error.message}</p>`;
    }
});

// ==UserScript==
// @name         Přidat tlačítko pro stažení fotky (upravené)
// @namespace    http://tampermonkey.net/
// @version      1.1
// @description  Přidá tlačítko pro přímý download fotky do panelu
// @author       AI Assistant
// @match        https://*.pinterest.com/*
// @run-at       document-start
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    // Funkce pro přidání tlačítka
    function addDownloadButton() {
        // Najdi panel s tlačítky
        const panel = document.querySelector('.hs0.un8.b23.JrK');
        if (!panel) return;

        // Vytvoř nový div xuA pro tlačítko
        const newDiv = document.createElement('div');
        newDiv.className = 'xuA';
        newDiv.innerHTML = `
            <div class="zI7">
                <div class="KS5 hs0 un8 C9i TB_">
                    <div class="oy8 zI7">
                        <div aria-label="Download" class="zI7">
                            <button aria-label="Download" class="yfm adn yQo lnZ wsz" tabindex="0" type="button">
                                <div class="KuF kVc adn yQo S9z ncU BG7">
                                    <div class="SPw _O1 KS5 mQ8 AAn uPZ" style="height: 48px; width: 48px;">
                                        <svg aria-hidden="true" aria-label="" class="gUZ U9O kVc Uvi" height="24" role="img" viewBox="0 0 24 24" width="24">
                                            <path d="M17.7 5.8 12 .08l-5.7 5.7L7.7 7.2 11 3.9V15h2V3.91l3.3 3.3zM2 18v-5H0v5a4 4 0 0 0 4 4h16a4 4 0 0 0 4-4v-5h-2v5a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2"></path>
                                        </svg>
                                    </div>
                                </div>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;

        // Přidej onclick událost pro download
        const button = newDiv.querySelector('button');
        button.addEventListener('click', async function() {
            // Najdi hlavní obrázek (uprav selektor podle potřeby)
            const img = document.querySelector('img[src*="pinimg.com"]');
            if (!img) {
                alert('Obrázek nenalezen!');
                return;
            }

            const url = img.src;

            try {
                // Fetch obrázku jako blob
                const response = await fetch(url, { mode: 'no-cors' });
                if (!response.ok) throw new Error('Chyba při fetchi');

                const blob = await response.blob();
                const blobUrl = URL.createObjectURL(blob);

                // Vytvoř a spusť download
                const a = document.createElement('a');
                a.href = blobUrl;
                a.download = 'foto.jpg';
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);

                // Uvolni URL
                URL.revokeObjectURL(blobUrl);
            } catch (error) {
                console.error(error);
                alert('Stažení selhalo. Možná kvůli omezením stránky (CORS). Zkus ručně.');
            }
        });

        // Přidej nový div do panelu
        panel.appendChild(newDiv);
    }

    // Spusť po načtení stránky
    window.addEventListener('load', addDownloadButton);
})();

function evaluatePump() {
    if (currentLiters <= 0) return;

    const diff = Math.round((currentLiters - targetLiters) * 100) / 100;
    const absDiff = Math.abs(diff);
    const banner = document.getElementById('resultBanner');
    const title = document.getElementById('resultTitle');
    const desc = document.getElementById('resultDesc');
    const btnShop = document.getElementById('btnGoShop');

    banner.className = 'result-banner';
    banner.style.display = 'flex';

    // Obchod nabídneme už od 1 litru až do 22 litrů (i když nedotankoval do cíle!)
    const roundedFuelDots = Math.max(1, Math.round(currentLiters));
    if (currentLiters >= 0.8 && roundedFuelDots <= 22) {
      btnShop.style.display = 'inline-flex';
      btnShop.textContent = `🛒 Jít platit (${roundedFuelDots} teček za benzín)`;
    } else {
      btnShop.style.display = 'none';
    }

    if (absDiff === 0) {
      banner.classList.add('win');
      title.textContent = "🏆 NAPROSTO PŘESNÁ TREFÁ!";
      desc.textContent = `Trefil jsi přesně ${targetLiters.toFixed(2)} L!`;
      playWinSound();
    } else if (diff < 0) {
      // Nedotankováno – v režimu obchodu to nevadí, ušetřil si mince!
      const savedDots = Math.max(0, Math.round(targetLiters) - roundedFuelDots);
      banner.classList.add('close');
      title.textContent = "⛽ STOPNUTO PŘED CÍLEM";
      desc.textContent = savedDots > 0
        ? `Chybí ${absDiff.toFixed(2)} L do předvolby – ušetřil jsi asi ${savedDots} teček do obchodu! Můžeš ještě dotankovat, nebo jít rovnou platit.`
        : `Chybí ${absDiff.toFixed(2)} L – můžeš ještě dotankovat, nebo jít rovnou platit.`;
      playTick(620, 0.1);
    } else {
      banner.classList.add('over');
      title.textContent = "💦 TROCHU PŘETEKLO!";
      desc.textContent = `Přeteklo o +${absDiff.toFixed(2)} L nad předvolbu.`;
      playErrorSound();
    }
  }
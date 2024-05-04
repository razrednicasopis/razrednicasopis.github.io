const prikaziDatum = () => {
    const danes = new Date();
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    const formatiranDatum = danes.toLocaleDateString('sl-SI', options);
    document.getElementById('datum').textContent = formatiranDatum;
  };

  prikaziDatum();
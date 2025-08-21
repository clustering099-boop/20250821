
document.getElementById("getMealBtn").addEventListener("click", () => {
  const dateInput = document.getElementById("date").value;
  const mealInfoDiv = document.getElementById("mealInfo");

  if (!dateInput) {
    mealInfoDiv.textContent = "날짜를 선택해주세요.";
    return;
  }

  const ymd = dateInput.replace(/-/g, ""); // YYYYMMDD 형식
  const apiURL = `https://open.neis.go.kr/hub/mealServiceDietInfo?ATPT_OFCDC_SC_CODE=J10&SD_SCHUL_CODE=7530143&MLSV_YMD=${ymd}`;

  fetch(apiURL)
    .then(response => response.text())
    .then(xmlText => {
      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString(xmlText, "application/xml");
      const rows = xmlDoc.getElementsByTagName("row");

      if (rows.length === 0) {
        mealInfoDiv.textContent = "해당 날짜의 급식 정보가 없습니다.";
        return;
      }

      let mealOutput = "";

      for (let i = 0; i < rows.length; i++) {
        const mealName = rows[i].getElementsByTagName("MMEAL_SC_NM")[0].textContent; // 조식/중식/석식
        const dishNode = rows[i].getElementsByTagName("DDISH_NM")[0];
        const calNode = rows[i].getElementsByTagName("CAL_INFO")[0];
        const ntrNode = rows[i].getElementsByTagName("NTR_INFO")[0];

        let dishes = dishNode ? dishNode.textContent.replace(/<br\/?>/g, "\n") : "메뉴 정보 없음";
        const calories = calNode ? calNode.textContent : "칼로리 정보 없음";
        const nutrients = ntrNode ? ntrNode.textContent : "영양 정보 없음";

        // Get selected allergies
        const selectedAllergies = Array.from(document.querySelectorAll('.allergy-checkboxes input[type="checkbox"]:checked'))
          .map(checkbox => checkbox.value);

        // Check for allergies and highlight allergens
        let allergyWarning = '';
        if (selectedAllergies.length > 0) {
          const allergyPattern = new RegExp(`\\(([^)]*(?:${selectedAllergies.join('|')})[^)]*)\\)`, 'g');
          const foundAllergies = dishes.match(allergyPattern);
          
          if (foundAllergies) {
            allergyWarning = `<div class="allergy-warning">🚨 알레르기 주의: ${foundAllergies.join(', ')}</div>`;
            dishes = dishes.replace(allergyPattern, '<span class="allergen-highlight">$&</span>');
          }
        }

        // Parse nutrients into list items
        const nutrientsList = nutrients.split('<br/>').map(item => 
          item.trim().replace(/<\/?[^>]+(>|$)/g, "")
        ).filter(item => item.length > 0);

        mealOutput += `
          <div class="meal-card">
            <div class="meal-title">🍽️ ${mealName}</div>
            ${allergyWarning}
            <div class="meal-menu">${dishes.replace(/\n/g, '<br>')}</div>
            <div class="calories">🔥 ${calories}</div>
            <ul class="nutrients">
              ${nutrientsList.map(nutrient => `<li>${nutrient}</li>`).join('')}
            </ul>
          </div>
        `;
      }

      mealInfoDiv.innerHTML = mealOutput.trim();
    })
    .catch(error => {
      console.error(error);
      mealInfoDiv.textContent = "급식 정보를 불러오는 중 오류가 발생했습니다.";
    });
});

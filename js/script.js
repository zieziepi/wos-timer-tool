// 各タブの状態を保持するオブジェクト
const pageStates = {
  page1: {
    nextInputId: 1,
  },
  page2: {
    nextInputId: 1,
  },
  page3: {
    nextInputId: 1,
  },
  page4: {
    nextInputId: 1,
  },
  page5: {
    nextInputId: 1,
  },
};

let activePageId = "page1"; // 現在アクティブなページのID

/**
 * タブを切り替える関数
 * @param {Event} evt - クリックイベントオブジェクト
 * @param {string} pageId - 切り替えるタブのID (例: 'page1')
 */
function openTab(evt, pageId) {
  // 全てのタブコンテンツを非表示にし、activeクラスを削除
  const tabContents = document.getElementsByClassName("tab-content");
  for (const content of tabContents) {
    content.style.display = "none";
    content.classList.remove("active");
  }

  // 全てのタブボタンからactiveクラスを削除
  const tabButtons = document.getElementsByClassName("tab-button");
  for (const button of tabButtons) {
    button.classList.remove("active");
  }

  // 指定されたタブコンテンツを表示し、activeクラスを追加
  document.getElementById(pageId).style.display = "block";
  document.getElementById(pageId).classList.add("active");
  // クリックされたタブボタンにactiveクラスを追加
  evt.currentTarget.classList.add("active");

  activePageId = pageId; // アクティブなページを更新

  // アクティブなタブに切り替わったときに、そのタブのinputを再度評価
  handleInput();
}

/**
 * 新しい入力行を追加する関数
 */
function addInputRow() {
  const container = document.querySelector(
    `#${activePageId} .input-forms-container`
  );
  const newState = pageStates[activePageId];
  const newRow = document.createElement("div");
  newRow.className = "input-row highlight-new";
  const currentId = newState.nextInputId++; // 一意のIDを割り当ててインクリメント
  newRow.dataset.id = currentId;

  // IDとfor属性にアクティブなページのIDを付加
  newRow.innerHTML = `
        <label for="nameInput-${activePageId}-${currentId}">名前：</label><input type="text" id="nameInput-${activePageId}-${currentId}" class="name-input" oninput="handleInput()" autocomplete="off" />
        <label for="secInput-${activePageId}-${currentId}">秒数:</label><input type="number" id="secInput-${activePageId}-${currentId}" class="sec-input" oninput="handleInput()" autocomplete="off" />
    `;
  container.appendChild(newRow);

  // スクロールして新しい入力行が見えるようにする
  newRow.scrollIntoView({
    behavior: "smooth",
    block: "nearest",
  });

  // ハイライトを時間差で削除
  setTimeout(() => {
    newRow.classList.remove("highlight-new");
  }, 1000);
}

/**
 * 入力値の変更を処理し、出発時間リストを更新する関数
 */
function handleInput() {
  const container = document.querySelector(
    `#${activePageId} .input-forms-container`
  );
  let inputRows = Array.from(container.querySelectorAll(".input-row"));
  let rawEntries = [];
  let rowsToDelete = [];

  // 現在の入力行を評価し、有効なエントリを抽出し、削除対象をマーク
  inputRows.forEach((row, index) => {
    const nameInput = row.querySelector(".name-input");
    const secInput = row.querySelector(".sec-input");

    const name = nameInput ? nameInput.value.trim() : "";
    const sec = secInput ? parseInt(secInput.value, 10) : NaN;

    const isLastRow = index === inputRows.length - 1;

    // 名前と秒数が両方空の場合
    if (name === "" && isNaN(sec)) {
      if (!isLastRow && inputRows.length > 1) {
        // 最後の行以外で完全に空の行は削除対象
        rowsToDelete.push(row);
      }
    } else if (name !== "" && !isNaN(sec) && sec >= 0) {
      // 名前があり、秒数が有効な場合はリストに追加
      rawEntries.push({
        name: name,
        sec: sec,
      });
    }
    // 名前が空で秒数がある、または名前があって秒数が空のケースは、ユーザーが入力中の可能性があるので削除しない
  });

  // 削除対象の行を実際に削除
  rowsToDelete.forEach((row) => {
    container.removeChild(row);
  });

  // 削除後にinputRowsを再取得して、現在の正確な行数を反映
  inputRows = Array.from(container.querySelectorAll(".input-row"));

  // 秒数の降順でソート
  rawEntries.sort((a, b) => b.sec - a.sec);

  let displayedEntries = [];
  if (rawEntries.length > 0) {
    const maxSec = rawEntries[0].sec; // 最大秒数を取得
    rawEntries.forEach((entry) => {
      const calculatedSec = entry.sec - maxSec; // 最大秒数からの差を計算
      displayedEntries.push({
        name: entry.name,
        sec: Math.abs(calculatedSec).toString().padStart(2, "0"), // 絶対値を取り2桁表示
      });
    });
    // 最大秒数のエントリの秒数を "00" に設定
    if (displayedEntries.length > 0) {
      displayedEntries[0].sec = "00";
    }
  }

  const outputList = document.querySelector(`#${activePageId} .output-list`);
  outputList.innerHTML = ""; // 出力リストをクリア

  if (displayedEntries.length === 0) {
    outputList.textContent = "入力がありません。";
  } else {
    displayedEntries.forEach((entry) => {
      const div = document.createElement("div");
      div.className = "output-list-item";
      div.textContent = `${entry.name} :${entry.sec}`;
      outputList.appendChild(div);
    });
  }

  // 最後の入力行が全て入力されているか、または全く行がない場合に新しい行を追加
  const lastInputRow = inputRows[inputRows.length - 1];
  if (
    !lastInputRow ||
    (lastInputRow.querySelector(".name-input").value.trim() !== "" &&
      lastInputRow.querySelector(".sec-input").value.trim() !== "" &&
      !isNaN(parseInt(lastInputRow.querySelector(".sec-input").value, 10)))
  ) {
    addInputRow();
  }
}

/**
 * 出力リストの内容をクリップボードにコピーする関数
 */
function copyToClipboard() {
  const outputList = document.querySelector(`#${activePageId} .output-list`);
  const copyMessage = document.querySelector(`#${activePageId} .copy-message`);
  let textToCopy = "";

  const hasListItems = outputList.querySelector(".output-list-item") !== null;

  if (!hasListItems) {
    // コピーする内容がない場合のメッセージ
    copyMessage.textContent = "コピーする内容がありません。";
    copyMessage.style.color = "orange";
    copyMessage.classList.add("show");
    setTimeout(() => {
      copyMessage.classList.remove("show");
    }, 2000);
    return;
  }

  // 出力リストの各項目をテキストとして結合
  Array.from(outputList.children).forEach((item) => {
    if (item.classList.contains("output-list-item")) {
      textToCopy += item.textContent + "\n";
    }
  });

  textToCopy = textToCopy.trim(); // 末尾の改行を削除

  // クリップボードへのコピーを実行
  navigator.clipboard
    .writeText(textToCopy)
    .then(() => {
      // 成功時のメッセージ
      copyMessage.textContent = "コピーしました！";
      copyMessage.style.color = "green";
      copyMessage.classList.add("show");
      setTimeout(() => {
        copyMessage.classList.remove("show");
      }, 2000);
    })
    .catch((err) => {
      // 失敗時のメッセージ
      console.error("クリップボードへのコピーに失敗しました", err);
      copyMessage.textContent = "コピーに失敗しました。";
      copyMessage.style.color = "red";
      copyMessage.classList.add("show");
      setTimeout(() => {
        copyMessage.classList.remove("show");
      }, 2000);
    });
}

// ページロード時に実行される初期化処理
document.addEventListener("DOMContentLoaded", () => {
  // 最初のタブをアクティブにする
  document.querySelector(".tab-button").click();
});

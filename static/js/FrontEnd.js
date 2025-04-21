const summaryBox = document.getElementById('summary'); // 取得顯示統計摘要的 DOM 元素
const historyList = document.getElementById('historyList'); // 取得顯示歷史記錄的 DOM 元素
const dropArea = document.getElementById('dropArea'); // 取得拖曳上傳區域的 DOM 元素
let droppedFile = null; // 用來暫存拖曳上傳的檔案
let previewModalInstance = null; // 用來保存 Bootstrap Modal 的實例

// 這裡是用來顯示上傳的檔案資訊的區域
// 分析統計摘要（根據後端資料）

//---------------------------------------------------
// 更新統計摘要的函數，根據後端傳回的資料進行統計
function updateSummary(data) {
    const total = data.length; // 總記錄數
    const high = data.filter(d => d.riskLevel === '高風險').length; // 高風險數量
    const medium = data.filter(d => d.riskLevel === '中風險').length; // 中風險數量
    const low = data.filter(d => d.riskLevel === '低風險').length; // 低風險數量
    const ignore = data.filter(d => d.riskLevel === '忽略').length; // 忽略數量

    // 更新統計摘要的 HTML 內容
    summaryBox.innerHTML = `
        共 <strong>${total}</strong> 筆紀錄：<br>
        🚨 高風險：<strong>${high}</strong> 筆<br>
        ⚠️ 中風險：<strong>${medium}</strong> 筆<br>
        ✅ 低風險：<strong>${low}</strong> 筆<br>
        🟢 忽略：<strong>${ignore}</strong> 筆
    `;
}

//---------------------------------------------------










//---------------------------------------------------
// 新增歷史記錄項目的函數
function addHistoryItem(fileName, summaryText) {
    const now = new Date(); // 取得當前時間
    const time = now.toLocaleTimeString(); // 格式化時間為本地時間字串
    const record = {
        file: fileName, // 檔案名稱
        time: time, // 上傳時間
        summary: summaryText // 統計摘要
    };

    // 從 localStorage 取得歷史記錄，若無則初始化為空陣列
    const stored = JSON.parse(localStorage.getItem('historyData') || '[]');
    stored.unshift(record); // 將新記錄插入到陣列的最前面
    localStorage.setItem('historyData', JSON.stringify(stored)); // 更新 localStorage
    //localStorage.setItem('historyHTML', historyList.innerHTML);

    // 同時更新畫面上的歷史記錄列表
    const li = document.createElement('li');
    li.innerHTML = `<strong>${fileName}</strong> - ${time}<br><span>${summaryText}</span>`;
    historyList.prepend(li); // 插入到歷史記錄列表的最前面
}
//---------------------------------------------------










//---------------------------------------------------
// 設置拖曳上傳事件的監聽器
['dragenter', 'dragover'].forEach(eventName => {
    dropArea.addEventListener(eventName, e => {
        e.preventDefault(); // 阻止預設行為（例如打開檔案）
        dropArea.classList.add('dragover'); // 增加拖曳樣式
    });
});

['dragleave', 'drop'].forEach(eventName => {
    dropArea.addEventListener(eventName, e => {
        e.preventDefault(); // 阻止預設行為
        dropArea.classList.remove('dragover'); // 移除拖曳樣式
    });
});

// 處理檔案拖曳完成的事件
dropArea.addEventListener('drop', e => {
    e.preventDefault();
    dropArea.classList.remove('dragover');

    droppedFile = e.dataTransfer.files[0];
    document.getElementById('excelFile').files = e.dataTransfer.files;
    document.getElementById('fileInfo').innerText = `已拖曳檔案：${droppedFile.name}`;

    // ✅ 自動啟用上傳按鈕
    document.getElementById('submitBtn').disabled = false;
});

//---------------------------------------------------

// --------------------------------------------------------------------------------------
// 設置表單提交事件的監聽器
document.getElementById('uploadForm').addEventListener('submit', function(e) {
    e.preventDefault(); // 阻止表單的預設提交行為（避免整頁刷新）

    const fileInput = document.getElementById('excelFile'); // 取得檔案輸入框
    const file = droppedFile || fileInput.files[0]; // 優先使用拖曳的檔案，否則使用輸入框選擇的檔案
    const spinner = document.getElementById('spinner'); // 取得加載指示器
    const resultDiv = document.getElementById('result'); // 取得結果顯示區域
    const toast = document.getElementById('toast'); // 取得提示訊息區域
    const summaryBox = document.getElementById('summary'); // 取得統計摘要區域
    const historyList = document.getElementById('historyList'); // 取得歷史記錄區域
    const fileInfo = document.getElementById('fileInfo'); // 取得檔案資訊顯示區域
    const progressFill = document.getElementById('progressFill'); // 取得進度條填充區域
    const progressContainer = document.getElementById('uploadProgress'); // 取得進度條容器
    const progressPercent = document.getElementById('progressPercent'); // 取得進度百分比顯示區域

    // 初始化 UI
    spinner.style.display = 'block'; // 顯示加載指示器
    resultDiv.innerHTML = ''; // 清空結果區域
    summaryBox.innerHTML = ''; // 清空統計摘要
    progressFill.style.width = '0%'; // 重置進度條
    progressPercent.innerText = '0%'; // 重置進度百分比
    progressContainer.style.display = 'block'; // 顯示進度條容器

    if (!file) {
        alert('請選擇檔案'); // 如果沒有檔案，顯示提示訊息
        spinner.style.display = 'none'; // 隱藏加載指示器
        progressContainer.style.display = 'none'; // 隱藏進度條容器
        return;
    }

    const formData = new FormData(); // 建立表單資料物件
    formData.append('file', file); // 將檔案加入表單資料
    //--------------------------------------------------
    const xhr = new XMLHttpRequest(); // 建立 XMLHttpRequest 物件
    xhr.open('POST', '/upload', true); // 設定請求方法和目標 URL
    xhr.setRequestHeader('X-Requested-With', 'XMLHttpRequest'); // 設定請求標頭，表明這是 AJAX 請求

    // 上傳進度監控
    xhr.upload.onprogress = function(event) {
        if (event.lengthComputable) {
            const percent = (event.loaded / event.total) * 100; // 計算上傳進度百分比
            progressFill.style.width = percent.toFixed(2) + '%'; // 更新進度條寬度
            progressPercent.innerText = percent.toFixed(0) + '%'; // 更新進度百分比文字
        }
    };
//--------------------------------------------------

//---------------------------------------------------
// 處理上傳完成的回應
xhr.onload = function () {
    spinner.style.display = 'none'; // 隱藏加載指示器
    progressContainer.style.display = 'none'; // 隱藏進度條容器

    // 儲存分析結果與歷史記錄到 localStorage
    localStorage.setItem('resultHTML', resultDiv.innerHTML); // 儲存結果 HTML
    localStorage.setItem('summaryHTML', summaryBox.innerHTML); // 儲存統計摘要 HTML
    // localStorage.setItem('historyHTML', historyList.innerHTML); // 儲存歷史記錄 HTML

    if (xhr.status === 200) {
        const data = JSON.parse(xhr.responseText); // 解析伺服器回應的 JSON 資料
        if (data.error) {
            resultDiv.innerHTML = `<p style="color:red">錯誤：${data.error}</p>`; // 顯示錯誤訊息
            console.error('伺服器回傳錯誤：', data.error); // 在控制台輸出錯誤訊息
            return;
        }

        const resultText = JSON.stringify(data.data, null, 2); // 將結果資料轉為格式化的 JSON 字串

        // 渲染表格 HTML
        const tableHtml = `
          <div class="table-responsive">
            <table id="resultTable" class="display">
              <thead>
                <tr>
                  <th>Incident</th>
                  <th>Config Item</th>
                  <th>Severity</th>
                  <th>Frequency</th>
                  <th>Impact</th>
                  <th>Risk Level</th>
                  <th>Solution</th>
                  <th>Location</th>
                </tr>
              </thead>
              <tbody>
                ${data.data.map(item => `
                  <tr>
                    <td>${item.id || ''}</td>
                    <td>${item.configurationItem || ''}</td>
                    <td>${item.severityScore}</td>
                    <td>${item.frequencyScore}</td>
                    <td>${item.impactScore}</td>
                    <td><span class="badge ${item.riskLevel}">${item.riskLevel}</span></td>
                    <td>${item.solution || '—'}</td>
                    <td>${item.location || '—'}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
            </div>
        `;
        resultDiv.innerHTML = tableHtml; // 更新結果區域的 HTML

        // 初始化 DataTable 並插入按鈕
        $(document).ready(function () {
            const table = $('#resultTable').DataTable({
                pageLength: 10, // 每頁顯示 10 筆資料
                language: {
                    search: "🔍 搜尋：", // 搜尋框的提示文字
                    lengthMenu: "顯示 _MENU_ 筆資料", // 每頁顯示筆數的選單文字
                    info: "第 _START_ 到 _END_ 筆，共 _TOTAL_ 筆", // 資訊文字
                    paginate: {
                        previous: "上一頁", // 分頁的上一頁文字
                        next: "下一頁" // 分頁的下一頁文字
                    }
                },
                initComplete: function () {
                    // 建立並插入按鈕
                    const previewBtn = document.createElement('button');
                    previewBtn.className = 'btn btn-outline-primary'; // 設定按鈕樣式
                    previewBtn.id = 'previewAllBtn'; // 設定按鈕 ID
                    previewBtn.innerText = '📋 預覽所有資料'; // 設定按鈕文字
                    previewBtn.style.marginLeft = '12px'; // 設定按鈕的左邊距

                    const lengthControl = document.querySelector('.dataTables_length'); // 取得 DataTable 的長度控制區域
                    lengthControl.appendChild(previewBtn); // 將按鈕插入到長度控制區域

                    // 綁定按鈕的點擊事件
                    previewBtn.onclick = function () {
                        const modalContent = document.getElementById('modalContent'); // 取得 Modal 的內容區域
                        const headers = ["Incident", "Config Item", "Severity", "Frequency", "Impact", "Risk Level", "Solution", "Location"]; // 表格標題

                        let html = `<table class="table table-bordered table-sm"><thead><tr>`;
                        headers.forEach(h => html += `<th>${h}</th>`); // 生成表格標題列
                        html += `</tr></thead><tbody>`;

                        data.data.forEach(item => {
                            html += `
                                <tr>
                                  <td>${item.id || ''}</td>
                                  <td>${item.configurationItem || ''}</td>
                                  <td>${item.severityScore}</td>
                                  <td>${item.frequencyScore}</td>
                                  <td>${item.impactScore}</td>
                                  <td><span class="badge ${item.riskLevel}">${item.riskLevel}</span></td>
                                  <td>${item.solution || '—'}</td>
                                  <td>${item.location || '—'}</td>
                                </tr>
                            `;
                        });
                        html += `</tbody></table>`;
                        modalContent.innerHTML = html; // 更新 Modal 的內容

                        // 顯示 Modal
                        const modal = new bootstrap.Modal(document.getElementById('previewModal'));
                        modal.show();
                    };
                }
            });
        });

        updateSummary(data.data); // 更新統計摘要
        toast.classList.add('show'); // 顯示提示訊息
        setTimeout(() => toast.classList.remove('show'), 6000); // 6 秒後隱藏提示訊息

        addHistoryItem(file.name, summaryBox.innerText); // 新增歷史記錄
// ---------------------------------------------------尚未實做出來-------------------------------------------------------------------------------------
        document.getElementById('copyResult').onclick = () => {
            navigator.clipboard.writeText(resultText).then(() => {
                alert('✅ 結果已複製到剪貼簿！'); // 成功複製提示
            }).catch(err => {
                alert('❌ 複製失敗：' + err); // 複製失敗提示
            });
        };

        fileInput.value = ''; // 清空檔案輸入框
        droppedFile = null; // 清空拖曳檔案暫存

        fileInfo.style.transition = 'opacity 0.5s'; // 設定檔案資訊的淡出效果
        fileInfo.style.opacity = '0'; // 開始淡出
        setTimeout(() => fileInfo.innerText = '', 500); // 0.5 秒後清空文字

        resultDiv.scrollIntoView({ behavior: 'smooth' }); // 平滑滾動到結果區域
// ---------------------------------------------------尚未實做出來-------------------------------------------------------------------------------------

    } else {
        resultDiv.innerHTML = '<p style="color:red">伺服器錯誤，請稍後再試。</p>'; // 顯示伺服器錯誤訊息
        console.error('HTTP 狀態碼：', xhr.status); // 在控制台輸出 HTTP 狀態碼
        console.log('📦 Response Text:', xhr.responseText); // 在控制台輸出伺服器回應文字
    }
};
 //--------------------------------------------------- sperate
    

    xhr.onerror = function() {
        spinner.style.display = 'none'; // 隱藏加載指示器
        progressContainer.style.display = 'none'; // 隱藏進度條容器
        resultDiv.innerHTML = '<p style="color:red">發生錯誤，請稍後再試。</p>'; // 顯示錯誤訊息
    };


    // 在送出前檢查是否重複上傳
    const filename = file.name;// 取得檔案名稱


    const checkDuplicateAndUpload = () => {
        const xhrCheck = new XMLHttpRequest(); // 建立 XMLHttpRequest 物件
        xhrCheck.open('GET', '/files', true); // 發送 GET 請求到伺服器以檢查檔案是否已存在
        xhrCheck.onload = function () {
            if (xhrCheck.status === 200) { // 如果伺服器回應成功
                const existingFiles = JSON.parse(xhrCheck.responseText).files; // 解析伺服器回應的檔案列表

                if (existingFiles.includes(filename)) { // 如果檔案已存在
                    spinner.style.display = 'none'; // 隱藏加載指示器
                    progressContainer.style.display = 'none'; // 隱藏進度條容器
                    alert(`❌ 上傳失敗：檔案 "${filename}" 已存在，請重新命名或更換檔案`); // 顯示錯誤提示
                    fileInfo.innerText = `❌ "${filename}" 已存在，請重新命名`; // 更新檔案資訊顯示
                    fileInfo.style.color = 'red'; // 設定文字顏色為紅色
                    return; // 結束函數執行
                }

                // ✅ 如果檔案不存在，正式上傳
                xhr.send(formData); // 發送檔案到伺服器
            } else {
                alert('⚠️ 無法檢查檔案是否重複，請稍後再試'); // 顯示錯誤提示
            }
        };
        xhrCheck.onerror = function () {
            alert('⚠️ 檢查檔案是否存在時發生錯誤'); // 顯示錯誤提示
        };
        xhrCheck.send(); // 發送檢查請求
    };

    // 👉 取代 xhr.send(formData)
    checkDuplicateAndUpload();  // 啟動檢查並上傳流程
});

// --------------------------------------------------------------------------------------



// --------------------------------------------------------------------------------------


    // 監聽檔案輸入框的變更事件
    document.getElementById('excelFile').addEventListener('change', function () {
        // 取得使用者選擇的檔案
        const file = this.files[0];
        // 取得顯示檔案資訊的 DOM 元素
        const info = document.getElementById('fileInfo');
        // 取得提交按鈕的 DOM 元素
        const submitBtn = document.getElementById('submitBtn'); // 👈 抓按鈕

        // 如果有選擇檔案
        if (file) {
            // 更新檔案資訊顯示區域，顯示檔案名稱
            info.innerText = `已選擇檔案：${file.name}`;
            // 啟用提交按鈕
            submitBtn.disabled = false; // ✅ 啟用按鈕
        } else {
            // 如果未選擇檔案，清空檔案資訊顯示區域
            info.innerText = '';
            // 禁用提交按鈕
            submitBtn.disabled = true;  // 🚫 關閉按鈕
        }
    });
// --------------------------------------------------------------------------------------




// 深色模式切換 & 保存偏好
window.addEventListener('DOMContentLoaded', () => {
    let isDark = localStorage.getItem('dark-mode'); // 從 localStorage 取得深色模式偏好
    const savedHistory = JSON.parse(localStorage.getItem('historyData') || '[]'); // 從 localStorage 取得歷史記錄

    // 清空歷史列表
    historyList.innerHTML = ''; // 清空歷史記錄的 DOM 元素

    // 讀取 localStorage 中的結果與歷史紀錄
    if (localStorage.getItem('resultHTML')) {
        document.getElementById('result').innerHTML = localStorage.getItem('resultHTML'); // 恢復結果區域的 HTML
    }
    if (localStorage.getItem('summaryHTML')) {
        document.getElementById('summary').innerHTML = localStorage.getItem('summaryHTML'); // 恢復統計摘要的 HTML
    }
    // if (localStorage.getItem('historyHTML')) {
    //     document.getElementById('historyList').innerHTML = localStorage.getItem('historyHTML'); // 恢復歷史記錄的 HTML
    // }
    //     // ✅ 從 historyData 重建 DOM
    // savedHistory.forEach(item => {
    //     const li = document.createElement('li');
    //     li.innerHTML = `<strong>${item.file}</strong> - ${item.time}<br><span>${item.summary}</span>`;
    //     historyList.appendChild(li);
    // });


    // 依照目前的 HTML 格式重建歷史記錄
    savedHistory.forEach(item => {
        const li = document.createElement('li'); // 建立新的列表項目
        li.innerHTML = `<strong>${item.file}</strong> - ${item.time}<br><span>${item.summary}</span>`; // 填充歷史記錄的內容
        historyList.appendChild(li); // 將列表項目加入到歷史記錄列表中
    });

    if (isDark === null) { // 如果沒有設定深色模式偏好
        isDark = 'true'; // 預設為深色模式
        localStorage.setItem('dark-mode', 'true'); // 保存深色模式偏好到 localStorage
    }

    if (isDark === 'false') {
        document.body.classList.remove('dark-mode'); // 如果偏好為淺色模式，移除深色模式樣式
    }

    // const toggleBtn = document.getElementById('sidebarToggle'); // 取得側邊欄切換按鈕
    // toggleBtn.textContent = document.body.classList.contains('sidebar-collapsed') ? '→' : '←'; // 根據側邊欄狀態更新按鈕文字

    const isDarktext = localStorage.getItem('dark-mode') === 'true'; // 檢查是否為深色模式
    if (isDarktext) {
        document.body.classList.add('dark-mode'); // 啟用深色模式樣式
        document.getElementById('toggleDarkMode').innerHTML = '🌞 淺色模式'; // 更新按鈕文字為"淺色模式"
    } else {
        document.body.classList.remove('dark-mode'); // 移除深色模式樣式
        document.getElementById('toggleDarkMode').innerHTML = '🌙 深色模式'; // 更新按鈕文字為"深色模式"
    }
});

// 監聽深色模式切換按鈕的點擊事件
document.getElementById('toggleDarkMode').addEventListener('click', () => {
    document.body.classList.toggle('dark-mode'); // 切換深色模式樣式

    const isDark = document.body.classList.contains('dark-mode'); // 檢查是否為深色模式
    const button = document.getElementById('toggleDarkMode'); // 取得深色模式切換按鈕
    if (isDark) {
        button.innerHTML = '🌙 深色模式'; // 深色模式時顯示"淺色模式"
    } else {
        button.innerHTML = '🌞 淺色模式'; // 淺色模式時顯示"深色模式"
    }

    localStorage.setItem('dark-mode', isDark); // 保存使用者選擇的模式到 localStorage
});

// 切換側邊欄的顯示狀態
function toggleSidebar() {
    document.body.classList.toggle('sidebar-collapsed'); // 切換側邊欄的樣式
    const toggleBtn = document.getElementById('sidebarToggle'); // 取得側邊欄切換按鈕
    if (document.body.classList.contains('sidebar-collapsed')) {
        toggleBtn.textContent = '→'; // 側邊欄收起時顯示"→"
    } else {
        toggleBtn.textContent = '←'; // 側邊欄展開時顯示"←"
    }
}

// 平滑滾動到指定的元素
function navigateTo(id) {
    const target = document.getElementById(id); // 取得目標元素
    if (target) {
        target.scrollIntoView({ behavior: 'smooth' }); // 平滑滾動到目標元素
    }
}

// 導航到不同的頁面
function navigateTo1(page) {
    if (page === 'upload') {
        window.location.href = '/'; // 導向首頁
    } else if (page === 'result') {
        window.location.href = '/result'; // 導向結果頁面
    } else if (page === 'history') {
        window.location.href = '/history'; // 導向歷史記錄頁面
    }
}
//---------------------------------------------------
//---------------------------------------------------
function showToast() {
    // 獲取 ID 為 'toast' 的 HTML 元素
    const toast = document.getElementById('toast');
    // 將該元素的顯示樣式設置為 'block'，使其可見
    toast.style.display = 'block';
    // 設置一個定時器，3 秒後將該元素的顯示樣式設置為 'none'，使其隱藏
    setTimeout(() => { toast.style.display = 'none'; }, 3000);
}
//---------------------------------------------------

function showPreview(item) {
    // 獲取 ID 為 'modalContent' 的 HTML 元素
    const modalContent = document.getElementById('modalContent');
  
    // 初始化一個 HTML 表格字符串，包含表格的起始標籤和樣式類名
    let html = `<table class="table table-bordered">`;
    // 遍歷傳入的 item 對象的每個鍵值對
    for (const key in item) {
        // 將每個鍵值對作為表格的一行，鍵作為表頭，值作為表格內容
        // 如果值為 null 或 undefined，則顯示 '—'
        html += `
        <tr>
          <th>${key}</th>
          <td>${item[key] ?? '—'}</td>
        </tr>
      `;
    }
    // 關閉表格標籤
    html += `</table>`;
  
    // 將生成的 HTML 表格內容插入到 modalContent 元素中
    modalContent.innerHTML = html;
  
    // 如果 previewModalInstance 尚未初始化，則創建一個新的 Bootstrap 模態框實例
    if (!previewModalInstance) {
        previewModalInstance = new bootstrap.Modal(document.getElementById('previewModal'), {
            backdrop: true, // 設置模態框背景可點擊
            keyboard: true // 允許使用鍵盤關閉模態框
        });
    }
    // 顯示模態框
    previewModalInstance.show();
}
//---------------------------------------------------

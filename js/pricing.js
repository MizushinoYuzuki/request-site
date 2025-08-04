document.addEventListener("DOMContentLoaded", function () {
    // --- 設定オブジェクト ---
    const priceConfig = {
        base: 8000,
        cg: {
            "1": { price: 10000, text: "3DCG一部使用" },
            "2": { price: 20000, text: "3DCG全部使用" }
        },
        p: {
            "2": { price: 2000, text:"合唱人数(2人)" },
            "3": { price: 4000, text:"合唱人数(3人)" },
            "4": { price: 6000, text:"合唱人数(4人)" },
            "5": { price: 8000, text:"合唱人数(5人以上)" }
        },
        d: {
            "2w": { price: 10000, text:"特急納品(2週間以内)" }
        },
        os: {
            "st": { price: 10000, text:"MVスタイル(ストーリー)" },
            "ly": { price: 20000, text:"MVスタイル(リリック)" }
        },
        opt: {
            hs: { price: 2000, text: "立ち絵の髪揺れ" },
            nc: { price: 10000, text: "クレジット記載なし" },
            ct: { multiplier: 1.5, text: "著作権譲渡" },
            cu: { multiplier: 1.5, text: "商用利用" },
            np: { multiplier: 2, text: "ポートフォリオ掲載不可" },
            bd: { isDiscount: true, text: "駆け出しクリエイター応援値引き" }
        }
    };

    const summaryMap = [
        { label: "お名前", name: "pn", placeholder: "(未記入)" },
        { label: "依頼内容", name: "t" },
        { label: "MVスタイル", name: "cs", condition: (formData) => formData.get('t') === 'c' },
        { label: "MVスタイル", name: "os", condition: (formData) => formData.get('t') === 'o' },
        { label: "納期の希望", name: "d" },
        { label: "3DCGの使用", name: "cg" },
        { 
            label: "合唱人数", name: "p", 
            condition: (formData) => {
                const cs = formData.get('cs');
                const os = formData.get('os');
                return cs === 'hg' || cs === 'og' || os === 'o-cho';
            }
        },
        { label: "追加オプション", name: "opt", type: 'checkboxGroup' },
        { label: "ご希望の連絡手段", name: "ct" },
        { label: "その他ご要望", name: "msg", placeholder: "(未記入)" }
    ];

    // --- 要素の取得 ---
    const form = document.getElementById("requestForm");
    const allInputs = form.querySelectorAll('select, input[type="checkbox"], textarea');
    const totalDisplay = document.getElementById("totalDisplay");
    const myTypeSelect = document.querySelector('select[name="t"]');
    const contactSelect = document.getElementById("contactSelect");
    const deliverySelect = document.querySelector('select[name="d"]');
    const cgSelect = document.querySelector('select[name="cg"]');
    const deadlineWarning = document.getElementById('deadline-warning');
    const coverStyleSelect = document.querySelector('select[name="cs"]');
    const originalStyleSelect = document.querySelector('select[name="os"]');
    const breakdownContainer = document.getElementById('price-breakdown');
    const resetButton = document.getElementById('resetButton');

    // アニメーション対象の要素をまとめる
    const collapsibleElements = {
        cover: document.getElementById('coverOptions'),
        original: document.getElementById('originalOptions'),
        originalCheckbox: document.getElementById('originalOptions-checkbox'),
        chorus: document.getElementById('chorusCountOptions'),
        ct: {
                email: [document.getElementById("mailaddress")], x: [document.getElementById("xDM")],
                discord: [document.getElementById("discordDM")], slack: [document.getElementById("slackDM")]
            }
    };

    let lastCalculatedTotal = 0;

    // --- 関数定義 ---
    function calculate() {
        const formData = new FormData(form);
        const breakdown = {
            items: [{ text: '基本料金', price: priceConfig.base }],
            multipliers: [],
            hasDiscount: false
        };

        let total = priceConfig.base;
        let multiplier = 1;

        //各項目の選択値を取得する
        const cgVal = formData.get("cg");
        const dVal = formData.get("d");
        const osVal = formData.get("os");
        const csVal = formData.get("cs");
        const pVal = formData.get("p");
        const options = formData.getAll('opt');

        // 料金と内訳を同時に更新する
        const addItem = (config, value) => {
            if (config && config[value]) {
                const item = config[value];
                if (item.price) {
                    total += item.price;
                    breakdown.items.push({ text: item.text, price: item.price });
                }
            }
        };

        addItem(priceConfig.cg, cgVal);
        addItem(priceConfig.d, dVal);
        addItem(priceConfig.os, osVal);
        
        if (csVal === 'hg' || csVal === 'og' || osVal === 'o-cho') {
            addItem(priceConfig.p, pVal);
        }

        options.forEach(value => {
            const effect = priceConfig.opt[value];
            if (!effect) return;
            if (effect.price) addItem(priceConfig.opt, value);
            if (effect.multiplier) {
                multiplier *= effect.multiplier;
                breakdown.multipliers.push(`${effect.text} (x${effect.multiplier})`);
            }
            if (effect.isDiscount) breakdown.hasDiscount = true;
        });

        let finalTotal = total * multiplier;
        let discountAmount = 0;

        if (breakdown.hasDiscount) {
            const discountedTotal = finalTotal / 2;
            const totalAfterFloor = Math.max(discountedTotal, 8000);
            discountAmount = finalTotal - totalAfterFloor;
            finalTotal = totalAfterFloor;
        }

        lastCalculatedTotal = Math.round(finalTotal);
        totalDisplay.textContent = `🧮 参考料金：¥${lastCalculatedTotal.toLocaleString()}`;

        // 内訳HTMLを生成して表示する
        let breakdownHtml = '<ul>';
        breakdown.items.forEach(item => {
            breakdownHtml += `<li><span class="item-text">${item.text}</span><span class="item-price">¥${item.price.toLocaleString()}</span></li>`;
        });
        breakdownHtml += '</ul>';

         if (breakdown.multipliers.length > 0) {
            breakdownHtml += `<div class="summary-item">${breakdown.multipliers.join(', ')}</div>`;
        }
        if (discountAmount > 0) {
            breakdownHtml += `<div class="summary-item">${priceConfig.opt.bd.text}: - ¥${Math.round(discountAmount).toLocaleString()}</div>`;
        }

        // 項目が基本料金のみは内訳を非表示にする
        const showBreakdown = breakdown.items.length > 1 || breakdown.multipliers.length > 0 || discountAmount > 0;
        breakdownContainer.style.display = showBreakdown ? 'block' : 'none';
        breakdownContainer.innerHTML = breakdownHtml;
    }

    function updateUrlFromState() {
        const params = new URLSearchParams();
        allInputs.forEach(input => {
            const name = input.name;
            if (!name || input.disabled || input.closest('[style*="display: none"]')) return;
            if (input.type === 'checkbox') {
                if (input.checked) params.append(name, input.value);
            } else if (input.value) {
                params.append(name, input.value);
            }
        });
        const newUrl = `${window.location.pathname}?${params.toString()}`;
        history.replaceState({}, '', newUrl);
    }

    function applyStateFromUrl() {
        const params = new URLSearchParams(window.location.search);
        params.forEach((value, key) => {
            const elements = form.elements[key];
            if (!elements) return;
            if (elements.nodeName === 'FIELDSET' || (elements.length && !elements.tagName)) { 
                const values = params.getAll(key);
                Array.from(elements).forEach(el => {
                    if (el.type === 'checkbox') el.checked = values.includes(el.value);
                });
            } else {
                elements.value = value;
            }
        });
        updateDependentUI();
    }

    function toggleCollapsible(element, show) {
        if (!element) return;
        if (show) {
            element.classList.add('visible');
            element.style.setProperty('--element-height', `${element.scrollHeight}px`);
        } else {
            element.classList.remove('visible');
        }
    }

    function updateDependentUI() {
        const selectedType = myTypeSelect.value;
        toggleCollapsible(collapsibleElements.cover, selectedType === 'c');
        toggleCollapsible(collapsibleElements.original, selectedType === 'o');
        toggleCollapsible(collapsibleElements.originalCheckbox, selectedType === 'o');

        if (selectedType !== 'c') coverStyleSelect.value = '';
        if (selectedType !== 'o') originalStyleSelect.value = '';
        
        const isCoverChorus = (coverStyleSelect.value === 'hg' || coverStyleSelect.value === 'og');
        const isOriginalChorus = (originalStyleSelect.value === 'o-cho');
        const showChorusCount = isCoverChorus || isOriginalChorus;
        
        toggleCollapsible(collapsibleElements.chorus, showChorusCount);
        
        if (!showChorusCount) {
            const chorusSelect = document.querySelector('select[name="p"]');
            if (chorusSelect) chorusSelect.value = '';
        }

        const isExpress = (deliverySelect.value === '2w');
        cgSelect.disabled = isExpress;
        deadlineWarning.style.display = isExpress ? 'block' : 'none';
        if (isExpress && cgSelect.value !== '0') cgSelect.value = '0';
    }

     function handleFormChange() {
        updateDependentUI();
        calculate();
        updateUrlFromState();
    }

    function copyToClipboard(text, message) {
        navigator.clipboard.writeText(text).then(() => alert(message)).catch(() => alert("コピーに失敗しました。"));
    }

    function getFullTextFromValue(name, value) {
        if (!value) return '(未選択)';
        const el = document.querySelector(`select[name="${name}"] option[value="${value}"]`);
        return el ? el.textContent : value;
    }

    function generateFullTextSummary() {
        const formData = new FormData(form);
        const summaryLines = [];
        
        summaryMap.forEach(item => {
            if (item.condition && !item.condition(formData)) {
                return;
            }
            
            let valueText;
            if (item.type === 'checkboxGroup') {
                const selectedOptions = formData.getAll(item.name);
                if (selectedOptions.length > 0) {
                    valueText = selectedOptions.map(value => 
                        `- ${document.querySelector(`input[name="${item.name}"][value="${value}"]`).parentElement.textContent.trim()}`
                    ).join('\n');
                } else {
                    valueText = 'なし';
                }
            } else {
                const value = formData.get(item.name);
                valueText = getFullTextFromValue(item.name, value) || item.placeholder || '(未選択)';
            }
            summaryLines.push(`■${item.label}:\n${valueText}`);
        });
        
        const summary = `【ご依頼内容のご相談】\n${summaryLines.join('\n\n')}\n---------------------------------\n■参考料金: ¥${lastCalculatedTotal.toLocaleString()}`;
        return summary.trim();
    }

    // --- イベントリスナーと初期化 ---
    allInputs.forEach(input => input.addEventListener('change', handleFormChange));

    document.getElementById("shareViaEmail").addEventListener('click', () => {
        const recipientEmail = "mirock.works@gmail.com";
        const subject = "ご依頼内容のご相談";
        const body = `参考料金結果になります。\n\n${window.location.href}\n金額: ¥${lastCalculatedTotal.toLocaleString()}\n\n--- ご依頼概要（曲名など）をこちらに書いてください。 ---\n\nご確認よろしくお願いいたします。`;
        window.location.href = `mailto:${recipientEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    });

    document.getElementById("shareViaUrl").addEventListener('click', () => copyToClipboard(window.location.href, "このページのURLをコピーしました。"));
    document.getElementById("shareViaText").addEventListener('click', () => copyToClipboard(generateFullTextSummary(), "ご依頼内容をクリップボードにコピーしました。"));
    document.getElementById("hamburger").addEventListener("click", function () {
        this.classList.toggle("active");
        document.getElementById("nav-menu").classList.toggle("show");
    });

    // リセットボタンのイベントリスナーを追加する
    document.getElementById('resetButton').addEventListener('click', () => {
        // URLからパラメータを消してページをリロードする
        window.location.href = window.location.pathname;
    });

    form.addEventListener('submit', (event) => {
        const isConfirmed = confirm('この内容で送信します。\nよろしいですか?');
        if (!isConfirmed) {
            event.preventDefault(); // 送信を中止する
        }
    });

    applyStateFromUrl();
    calculate();
});

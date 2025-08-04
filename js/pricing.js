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

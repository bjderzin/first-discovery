/*
Copyright 2015 OCAD University

Licensed under the Educational Community License (ECL), Version 2.0 or the New
BSD license. You may not use this file except in compliance with one these
Licenses.

You may obtain a copy of the ECL 2.0 License and BSD License at
https://github.com/fluid-project/infusion/raw/master/Infusion-LICENSE.txt
*/

(function ($, fluid) {

    "use strict";

    fluid.registerNamespace("gpii.firstDiscovery.panel");

    /*
     * Ranged panel: used as a grade for text size panel and other panels to adjust their preferences in a range
     */
    fluid.defaults("gpii.firstDiscovery.panel.ranged", {
        gradeNames: ["fluid.prefs.panel", "gpii.firstDiscovery.attachTooltip", "autoInit"],
        model: {
            // Preferences Maps should direct the default model state
            // to this model property. The component is configured
            // with the expectation that this is the salient model value.
            value: null
        },
        range: {
            min: 1,
            max: 2
        },
        step: 0.1,
        selectors: {
            rangeInstructions: ".gpiic-fd-instructions",
            meter: ".gpiic-fd-range-indicator",
            increase: ".gpiic-fd-range-increase",
            increaseLabel: ".gpiic-fd-range-increaseLabel",
            decrease: ".gpiic-fd-range-decrease",
            decreaseLabel: ".gpiic-fd-range-decreaseLabel"
        },
        selectorsToIgnore: ["meter", "increase", "decrease"],
        tooltipContentMap: {
            "increase": "increaseLabel",
            "decrease": "decreaseLabel"
        },
        protoTree: {
            rangeInstructions: {messagekey: "rangeInstructions"},
            increaseLabel: {messagekey: "increaseLabel"},
            decreaseLabel: {messagekey: "decreaseLabel"}
        },
        invokers: {
            stepUp: {
                funcName: "gpii.firstDiscovery.panel.ranged.step",
                args: ["{that}"]
            },
            stepDown: {
                funcName: "gpii.firstDiscovery.panel.ranged.step",
                args: ["{that}", true]
            },
            updateMeter: {
                funcName: "gpii.firstDiscovery.panel.ranged.updateMeter",
                args: ["{that}", "{that}.model.value"]
            }
        },
        listeners: {
            "afterRender.bindIncrease": {
                "this": "{that}.dom.increase",
                "method": "click",
                "args": ["{that}.stepUp"]
            },
            "afterRender.bindDecrease": {
                "this": "{that}.dom.decrease",
                "method": "click",
                "args": ["{that}.stepDown"]
            },
            "afterRender.updateButtonState": {
                listener: "gpii.firstDiscovery.panel.ranged.updateButtonState",
                args: ["{that}"]
            },
            "afterRender.updateMeter": "{that}.updateMeter",
            "afterRender.updateTooltipModel": {
                listener: "{that}.tooltip.applier.change",
                args: ["idToContent", {
                    expander: {
                        func: "{that}.tooltip.getTooltipModel"
                    }
                }]
            }
        },
        modelListeners: {
            "value": [{
                listener: "{that}.updateMeter",
                excludeSource: ["init"]
            }, {
                listener: "gpii.firstDiscovery.panel.ranged.updateButtonState",
                args: ["{that}"]
            }]
        }
    });

    gpii.firstDiscovery.panel.ranged.clip = function (value, min, max) {
        if (max > min) {
            return Math.min(max, Math.max(min, value));
        }
    };

    gpii.firstDiscovery.panel.ranged.step = function (that, reverse) {
        that.tooltip.close();   // close the existing tooltip before the panel is re-rendered

        var step = reverse ? (that.options.step * -1) : that.options.step;
        var newValue = that.model.value + step;
        newValue = gpii.firstDiscovery.panel.ranged.clip(newValue, that.options.range.min, that.options.range.max);
        that.applier.change("value", newValue);
    };

    gpii.firstDiscovery.panel.ranged.updateButtonState = function (that) {
        var isMax = that.model.value >= that.options.range.max;
        var isMin = that.model.value <= that.options.range.min;

        that.locate("increase").prop("disabled", isMax);
        that.locate("decrease").prop("disabled", isMin);
    };

    gpii.firstDiscovery.panel.ranged.calculatePercentage = function (value, min, max) {
        if (max > min) {
            var clipped = gpii.firstDiscovery.panel.ranged.clip(value, min, max);
            return ((clipped - min) / (max - min)) * 100;
        }
    };

    gpii.firstDiscovery.panel.ranged.updateMeter = function (that, value) {
        var percentage = gpii.firstDiscovery.panel.ranged.calculatePercentage(value, that.options.range.min, that.options.range.max);
        that.locate("meter").css("height", percentage + "%");
    };

    /*
     * Text size panel
     */

    fluid.defaults("gpii.firstDiscovery.panel.textSize", {
        gradeNames: ["gpii.firstDiscovery.panel.ranged", "autoInit"],
        preferenceMap: {
            "fluid.prefs.textSize": {
                "model.value": "default",
                "range.min": "minimum",
                "range.max": "maximum",
                "step": "divisibleBy"
            }
        }
    });

    /*
     * language panel
     */
    fluid.defaults("gpii.firstDiscovery.panel.lang", {
        gradeNames: ["fluid.prefs.panel", "autoInit"],
        preferenceMap: {
            "gpii.firstDiscovery.language": {
                "model.lang": "default",
                "controlValues.lang": "enum"
            }
        },
        controlValues: {
            lang: ["en", "fr", "es", "de", "ne", "sv"]
        },
        stringArrayIndex: {
            lang: ["lang-en", "lang-fr", "lang-es", "lang-de", "lang-ne", "lang-sv"]
        },
        styles: {
            display: "gpii-fd-display"
        },
        model: {
            startButtonNum: 0
        },
        modelRelay: {
            target: "startButtonNum",
            singleTransform: {
                type: "fluid.transforms.limitRange",
                input: "{that}.model.startButtonNum",
                min: 0,
                max: "{that}.options.controlValues.lang.length"
            }
        },
        modelListeners: {
            startButtonNum: "{that}.setButtonStates"
        },
        numOfLangPerPage: 3,
        selectors: {
            instructions: ".gpiic-fd-instructions",
            langRow: ".gpiic-fd-lang-row",
            langLabel: ".gpiic-fd-lang-label",
            langInput: ".gpiic-fd-lang-input",
            prev: ".gpiic-fd-lang-prev",
            next: ".gpiic-fd-lang-next"
        },
        selectorsToIgnore: ["prev", "next"],
        repeatingSelectors: ["langRow"],
        protoTree: {
            instructions: {markup: {messagekey: "langInstructions"}},
            expander: {
                type: "fluid.renderer.selection.inputs",
                rowID: "langRow",
                labelID: "langLabel",
                inputID: "langInput",
                selectID: "lang-radio",
                tree: {
                    optionnames: "${{that}.msgLookup.lang}",
                    optionlist: "${{that}.options.controlValues.lang}",
                    selection: "${lang}"
                }
            }
        },
        invokers: {
            setButtonStates: {
                funcName: "gpii.firstDiscovery.panel.lang.setButtonStates",
                args: ["{that}"]
            },
            bindPrev: {
                funcName: "gpii.firstDiscovery.panel.lang.adjustStartButtonNumber",
                args: ["{that}", -1]
            },
            bindNext: {
                funcName: "gpii.firstDiscovery.panel.lang.adjustStartButtonNumber",
                args: ["{that}", 1]
            }
        },
        listeners: {
            "afterRender.setInitialButtonStates": "{that}.setButtonStates",
            "afterRender.bindPrev": {
                "this": "{that}.dom.prev",
                method: "click",
                args: ["{that}.bindPrev"]
            },
            "afterRender.bindNext": {
                "this": "{that}.dom.next",
                method: "click",
                args: ["{that}.bindNext"]
            }
        }
    });

    gpii.firstDiscovery.panel.lang.adjustStartButtonNumber = function (that, adjustValue) {
        that.applier.change("startButtonNum", that.model.startButtonNum + adjustValue);
    };

    gpii.firstDiscovery.panel.lang.setButtonStates = function (that) {
        var langButtons = that.locate("langRow"),
            langButtonTotal = langButtons.length,
            displayCss = that.options.styles.display,
            startButtonNum = that.model.startButtonNum,
            endButtonNum = startButtonNum + that.options.numOfLangPerPage - 1;

        fluid.each(langButtons, function (button, index) {
            $(button).toggleClass(displayCss, index >= startButtonNum && index <= endButtonNum);
        });

        that.locate("prev").prop("disabled", startButtonNum === 0);
        that.locate("next").prop("disabled", endButtonNum > langButtonTotal - 2);
    };

    /*
     * Text to speech panel
     */
    fluid.defaults("gpii.firstDiscovery.panel.tts", {
        gradeNames: ["fluid.prefs.panel", "autoInit"],
        preferenceMap: {
            "fluid.prefs.speak": {
                "model.speak": "default"
            }
        }
    });

    /*
     * Contrast panel
     */
    fluid.defaults("gpii.firstDiscovery.panel.contrast", {
        gradeNames: ["fluid.prefs.panel", "autoInit"],
        preferenceMap: {
            "fluid.prefs.contrast": {
                "model.value": "default",
                "controlValues.lang": "enum"
            }
        }
    });

})(jQuery, fluid);

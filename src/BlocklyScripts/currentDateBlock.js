// exports.definitionBlocks = function (blocks, javaScript) {
// }

// exports.fieldXML = function () {
// }

exports.definitionBlocks = function (blocks, javaScript,BlocklyFieldDropdown) {
    /*
 * Block that display the current date time
 * @Author: Popescu Ionut Cosmin (cosmin.popescu93@gmail.com)
 * https://github.com/cosminpopescu14
 */
    const ORDER_NONE=99;
    blocks['displayCurrentDate'] = {

    
    init: function () {
        this.appendDummyInput()
            .appendField("Current Date");
        this.appendDummyInput()
            .appendField('Pick date format:')
            .appendField(new BlocklyFieldDropdown([
                ['Unix format', 'unix'],
                ['ISO format', 'iso'],
                ['Human format', 'human']
            ]), 'dateFormat');

        this.setOutput(true, null);
        this.setColour(100);
        this.setTooltip('Show current date.');
        this.setHelpUrl('https://www.w3schools.com/jsref/jsref_obj_date.asp');

    }
}
const dateFormats = {
    UNIX: 'unix',
    ISO: 'iso',
    HUMAN: 'human'
}

javaScript['displayCurrentDate'] = block => {
    let dropdownOption = block.getFieldValue('dateFormat');

    let operation = ''
    switch (dropdownOption.toString()) {

        case dateFormats.HUMAN:
            operation = `displayDateFormatted('${dateFormats.HUMAN}')`;
            break;
        case dateFormats.ISO:
            operation = `displayDateFormatted('${dateFormats.ISO}')`;
            break;
        case dateFormats.UNIX:
            operation = `displayDateFormatted('${dateFormats.UNIX}')`;
            break;

        default:
            console.log('Date time format not suported')
    }

    let code = operation;
    return [code, /*javaScript.*/ORDER_NONE];
}



}

exports.fieldXML = function () {
return `<block type="displayCurrentDate"></block>`;
}


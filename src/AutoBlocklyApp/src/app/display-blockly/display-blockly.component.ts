import { Component, OnInit, ɵɵsetComponentScope } from '@angular/core';
import * as Blockly from 'blockly';
import * as BlocklyJavaScript from 'blockly/javascript';
import * as acorn from 'acorn';
import * as bs from '@blockly/blocklyscripts';
import * as bh from '@blockly/blocklyhelpers';
import { TabulatorHelper } from './tabulator';
import { LoadShowUsageService } from '../load-show-usage.service';
import { DemoBlocks } from "../DemoBlocks";
import * as SwaggerParser from '@blockly/blocklyswagger';
import { firstValueFrom } from 'rxjs';
declare var Interpreter: any;
@Component({
  selector: 'app-display-blockly',
  templateUrl: './display-blockly.component.html',
  styleUrls: ['./display-blockly.component.css']
})
export class DisplayBlocklyComponent implements OnInit {

  
  public demoWorkspace: Blockly.WorkspaceSvg|null = null;
  public run: any;
  public demos:DemoBlocks[] = [];
  public demosCategories:Map<string,DemoBlocks[]> = new Map<string,DemoBlocks[]>();
  constructor(private tabulator:TabulatorHelper, private loadDemo: LoadShowUsageService) { 
    
    //console.log(bs.filterBlocks.definitionBlocks());

  }
  clearOutput(){
    this.step  = 0;
    this.showInner = '';
    this.tabulator.ClearDataGrid();
  } 

  step:number=0;
  RunCode(){
    var self=this;
    var f= (latestCode:string, initApi: any)=> {
      try{
      return new Interpreter(this.run.latestCode,initApi);
      }
      catch(e){
        self.ShowInnerWorkings();
        window.alert('please copy the left output and report there is an error at ' + JSON.stringify(e));

      }
    }
    this.run = bh.interpreterHelper.createInterpreter(this.demoWorkspace,BlocklyJavaScript);
    this.clearOutput();
    this.showInner = 'start program';
    var self=this;
    this.run.runCode(f, (data:any)=>{
      self.step++;
      self.showInner += `\n ${self.step} : ${data}`; 
      // console.log(`obtained ${data}`);
      this.tabulator.AddDataToGrid(data);
    },
    ()=>{
      self.showInner += `\n program executed`; 
      this.tabulator.FinishGrid();
    });
  }
  public ShowDemo(demo:DemoBlocks){
    this.loadDemo.getDemoBlock(demo.id).subscribe(
      data=>{

        var xml = Blockly.Xml.textToDom(data);
        if(this.demoWorkspace != null){
          Blockly.Xml.clearWorkspaceAndLoadFromXml(xml, this.demoWorkspace);
          window.alert('please press run code button');
        }
      }
    );
  }
  // swaggersUrl:string[]=[
  //   'https://microservicesportchooser.azurewebsites.net/swagger/v1/swagger.json',
  //   'https://netcoreblockly.herokuapp.com/swagger/v1/swagger.json',
  //   'https://petstore.swagger.io/v2/swagger.json'
  
  // ];
  public swaggerData:any[] = [];
  
  
  public registerSwaggerBlocksObjects(demoWorkspace:Blockly.Workspace, item:any):Element[]{
  

  var xmlList: Element[] = [];
  xmlList = item.fieldXMLObjects.map((it:any)=>Blockly.Xml.textToDom(it));
  // var cat='<category id="microservicesportchooserazurewebsitesnet" name="microservicesportchooserazurewebsitesnet"><block type="IRegister"></block></category>';
  // cat='<block type="IRegister"></block>';
  
  
  // var block = Blockly.Xml.textToDom(cat);
  // xmlList.push(block);
  return xmlList;  
  // console.log(data);
    // window.alert('a');
    // var str= data.map((it:any)=>it.categSwagger().toString() as string);
    // console.log(str);
    // var ret= str.map((it:string)=> Blockly.Xml.textToDom(it));
    // return ret;
  }
  public registerSwaggerBlocksAPI(demoWorkspace:Blockly.Workspace, item:any):Element[]{
    var xmlList: Element[] = [];
    xmlList = item.fieldXMLFunctions.map((it:any)=>Blockly.Xml.textToDom(it.gui));
    return xmlList;  
  
  }
  ngOnInit(): void {
      this.StartRegister();
  }
  async StartRegister(): Promise<void> {
    
    var swaggersUrl= await firstValueFrom( this.loadDemo.getSwaggerLinks());
    
    var swaggersDict: Map<string,any>  = new Map<string,any>();
    swaggersUrl.forEach(it=>{
      swaggersDict.set(it.id,new  SwaggerParser.parseData(it.link));
    });
        
    //console.log(newSwaggerCategories[0]);
    var parsers = Array.from(swaggersDict.values());
    parsers.forEach(async  (parser:any) => {            
          
          var api= await parser.ParseSwagger();
                    
          this.swaggerData.push(api);

          for(var i=0;i<api.GenerateBlocks.length;i++){
            var e=api.GenerateBlocks[i];
            e(Blockly.Blocks,BlocklyJavaScript, (arr:any[][])=>{
              
              return new Blockly.FieldDropdown(arr);
            });
          }   

          for(var i=0;i<api.GenerateFunctions.length;i++){
            var e=api.GenerateFunctions[i];
            var image=function (opKey:string){
              
              var image =`assets/httpImages/${opKey}.png`;
              return new Blockly.FieldImage(image, 90, 20, opKey );
            };
            e(Blockly.Blocks,BlocklyJavaScript,image);
          }   
        });
    // SwaggerParser
    // .parseSwagger
    // .parseSwagger('https://microservicesportchooser.azurewebsites.net/swagger/v1/swagger.json')
    // .then(function(api: any) {
    //   console.log(api[0]);
    //   api[0](Blockly.Blocks,BlocklyJavaScript);
    //   api[1](Blockly.Blocks,BlocklyJavaScript);

    //   // console.log(api[1](Blockly.Blocks,BlocklyJavaScript));
    // });

    var newSwaggerCategories=swaggersUrl.map(it=>
      
      `<category name='${it.id}'>` +  swaggersDict.get(it.id).categSwagger() +'</category>'
      );
    
      
    this.loadDemo.getDemoBlocks().subscribe(
      (data:DemoBlocks[])=>{
        this.demos=data.sort((a,b)=> a.description.localeCompare(b.description));
        var categories=data
              .map(it=>it.categories)
              .filter(it=> it?.length>0)
              .flatMap(it=>it.split(';'))
              .filter(it=> it?.length>0)              
              ;

            
        this.demosCategories.set("All",this.demos);
        categories.forEach(element => {
          this.demosCategories.set(element,data
            .filter(it=>it.categories?.length > 0)
            .filter(it => (";"+ it.categories +";").indexOf(';'+element+";")>-1)
            )
            
        });

      }
    );
    const gridElement = document.getElementById('steps');
    if(gridElement  == null){
      window.alert("gridElement is null");
      return;
    }
    this.tabulator.initGrid(gridElement);

    bs.filterBlocks.definitionBlocks(Blockly.Blocks, BlocklyJavaScript);
    bs.waitBlocks.definitionBlocks(Blockly.defineBlocksWithJsonArray, BlocklyJavaScript); 
    bs.xhrBlocks.definitionBlocks(Blockly.Blocks, BlocklyJavaScript,function (arr:any[][]){return new Blockly.FieldDropdown(arr)});
    bs.propBlocks.definitionBlocks(Blockly.Blocks, BlocklyJavaScript,function (arr:any){return new Blockly.FieldLabelSerializable(arr)});
    bs.guiBlocks.definitionBlocks(Blockly.Blocks, BlocklyJavaScript);
    bs.convertersBlocks.definitionBlocks(Blockly.Blocks, BlocklyJavaScript);
    bs.exportFileBlock.definitionBlocks(Blockly.Blocks, BlocklyJavaScript);
    bs.createObjectBlocks.definitionBlocks(Blockly.Blocks, BlocklyJavaScript, Blockly.Extensions,
      (item:string)=>{
        return new Blockly.FieldTextInput(item);
      }
      );
    bs.currentDateBlock.definitionBlocks(Blockly.Blocks, BlocklyJavaScript,
      function (arr:any[][]){return new Blockly.FieldDropdown(arr)});

    bs.dateFromTextBlock.definitionBlocks(Blockly.Blocks, BlocklyJavaScript);
    bs.waitBlocks.definitionBlocks(Blockly.Blocks, BlocklyJavaScript);
    bs.commentBlock.definitionBlocks(Blockly.Blocks, BlocklyJavaScript,
      (item:string)=>{
        return new Blockly.FieldLabelSerializable(item);
      }
      
      );
    
    bs.auth0Blocks.definitionBlocks(Blockly.Blocks, BlocklyJavaScript);
    var blocks=[
        bs.defaultBlocks.generalBlocks(),
        `    <category name="Advanced=>">
            ${bs.filterBlocks.fieldXML()}
            ${bs.xhrBlocks.fieldXML()}
            </category>
            <category id="catJSBLocks" name="JSBlocks">
            ${bs.propBlocks.fieldXML()}
            </category>
            <category id="catGUI" name="GUI">
            ${bs.guiBlocks.fieldXML()}
            </category>
        `,
        `<category id="catHelpers" colour="160" name="Helpers">
          ${bs.waitBlocks.fieldXML()}
        </category>`,
        `<category id="catConverters" colour="160" name="Converters">
          ${bs.convertersBlocks.fieldXML()}
        </category>`,
        `<category id="catExporter" colour="160" name="Exporter">
          ${bs.exportFileBlock.fieldXML()}
        </category>`,

        `<category id="catDates" colour="160" name="Dates">
          ${bs.currentDateBlock.fieldXML()}
          ${bs.dateFromTextBlock.fieldXML()}
          ${bs.waitBlocks.fieldXML()}
        </category>`,
        `${bs.commentBlock.fieldXML()}`,
        `${bs.createObjectBlocks.fieldXML()}`,
        `${bs.auth0Blocks.fieldXML()}`,
        `<category name="Swagger" id="catSwagger" expanded='true' >          
          ${newSwaggerCategories}
        </category> `

      ]      
      this.initialize(blocks);
      
    
  }
  showInner:string='';
  SaveBlocks(){
    bh.saveBlocksUrl.saveState(Blockly.Xml,this.demoWorkspace);
  }
  ShowInnerWorkings(){
    if(this.demoWorkspace == null){
      window.alert("demoWorkspace is null");
      return;
    }
    var xml = Blockly.Xml.workspaceToDom(this.demoWorkspace, true);
            var xml_text = Blockly.Xml.domToPrettyText(xml);
            this.showInner = `
            ${this.run.latestCode}
            ========
            ${xml_text}
            ========
           
            `
            
            ;
            //outputArea.value += latestCode;

  }
  Download():void{
    var name=window.prompt("Name?","blocks.txt");
    if(name == null)
      return;
    bh.saveLoad.DownloadBlocks(Blockly.Xml,this.demoWorkspace,name);
  }
  changeListener($event: any) : void {
    this.readThis($event.target);
  }

  readThis(inputValue: any) : void {
    var file:File = inputValue.files[0]; 
    var myReader:FileReader = new FileReader();
    var self=this;
    myReader.onloadend = function(e){
      // you can perform an action with readed data here
      //console.log(myReader.result);
      bh.saveLoad.LoadFile(Blockly.Xml,self.demoWorkspace,myReader.result);
      self.run.resetInterpreter();
    }
    myReader.readAsText(file);
    
  }
  private initialize(defaultBlocks: string[] ){
    const blocklyDiv = document.getElementById('blocklyDiv');
    if(blocklyDiv == null){
      window.alert("blocklyDiv is null");
      return;
    }
    var blocks=defaultBlocks.map(it=>`<sep></sep>${it}`);
    var toolboxXML=`<xml xmlns="https://developers.google.com/blockly/xml" id="toolbox-simple" style="display: none">
    ${blocks}
    </xml>`;
    // console.log(toolboxXML);
  this.demoWorkspace=Blockly.inject(blocklyDiv, {
      readOnly: false,
       media: 'media/',
      trashcan: true,
      move: {
        scrollbars: true,
        drag: true,
        wheel: true
      },
       toolbox: toolboxXML
    } as Blockly.BlocklyOptions);
    var self=this;
    
    window.setTimeout((myComponent: DisplayBlocklyComponent, xmlToolbox: string)=>{
      // console.log('start register');
      if(myComponent?.swaggerData == null)
        return;
var nr=myComponent.swaggerData.length;
    var toolbox = myComponent?.demoWorkspace?.updateToolbox(xmlToolbox.replace('Swagger',`Swagger(${nr})`));

        myComponent.swaggerData.forEach( (item :any)=>{
        if(myComponent?.demoWorkspace == null)
            return;

        console.log(item.paths.length);
        var xml=self.restoreBlocks;
        
        //demoWorkspace.updateToolbox(document.getElementById('toolbox'));

        console.log(item.swaggerUrl,item.findCategSwaggerFromPaths());
        // console.log(xmlToolbox);

        var nameCat="objects_"+ item.nameCategSwagger();
        var nameAPI="api_"+ item.nameCategSwagger();
        // console.log(nameCat);
        // console.log(myComponent.swaggerData);
        // console.log(myComponent.demoWorkspace);


        myComponent.demoWorkspace.registerToolboxCategoryCallback(nameCat,(d: Blockly.Workspace)=>{

              return myComponent.registerSwaggerBlocksObjects(d,item);

          } );
          myComponent.demoWorkspace.registerToolboxCategoryCallback(nameAPI,(d: Blockly.Workspace)=>{

            return myComponent.registerSwaggerBlocksAPI(d,item);
          });
        
     });
     myComponent.restoreBlocks();

  }, 2000, this, toolboxXML);
    ;
    // console.log(BlocklyJavaScript);
    this.run = bh.interpreterHelper.createInterpreter(this.demoWorkspace,BlocklyJavaScript);
    var self=this;
    this.demoWorkspace.addChangeListener(function (evt:any) {
      if (!evt.isUiEvent) {
          self.run.resetInterpreter();
          self.run.generateCodeAndLoadIntoInterpreter();
          self.ShowInnerWorkings();
      }
    });
  }
  public restoreBlocks(){
    bh.saveBlocksUrl.restoreState(Blockly.Xml,this.demoWorkspace);
  }

}

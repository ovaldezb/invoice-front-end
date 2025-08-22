export class RegimenFiscal{
  constructor(
    public id:string,
    public regimenfiscal:string,
    public descripcion:string,
    public fisica: boolean,
    public moral: boolean
  ){}
}
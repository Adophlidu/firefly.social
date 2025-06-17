// You can "install" types by extending this interface in each data provider
export interface DataSourceRegister {}
export type DataSource = keyof DataSourceRegister;

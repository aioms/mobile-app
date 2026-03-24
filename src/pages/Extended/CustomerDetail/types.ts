import { IOrder } from "@/types/order.type";
import { ICustomer as IBaseCustomer } from "../CustomerList/types";

export interface ICustomerDetail extends IBaseCustomer {
  orders?: IOrder[];
}

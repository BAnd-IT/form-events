export interface FormData {
  price: number;
  qty: number;
  amount: number;
  counter: number;
}

export interface EventLog {
  id: number;
  timestamp: Date;
  type: 'input_change' | 'button_click' | 'response_received';
  message: string;
  data?:  any;
  localStorage?: string;
}
// navigation.d.ts

export type RootStackParamList = {
    index: undefined;
    "updateproduct": { productId: string };
    "Reports/reportproduct": { productId: string };
    "Reports/reportcomments": { productId: string; commentsId: string };
    "Reports/reportmessage": { messageId: string; usermessageId: string };
    "userproduct": { userId: string };
    "createsell": undefined;
    "createbuy": undefined;
    "ProductDetails": { productId: string};
    "profile": undefined;
    "messagelist": undefined;
    "Rating": undefined;
    "userproduct": undefined;
    "(auth)/login": undefined;
    "(tabs)": undefined;
    "Rating": { productId: string; userId: string };
    // Add more routes as needed
  };
  
  // Extend the global ReactNavigation namespace
  declare global {
    namespace ReactNavigation {
      interface RootParamList extends RootStackParamList {}
    }
  }
  
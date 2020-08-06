import React, { useLayoutEffect } from 'react';
import { IonItem, IonButton, IonIcon, IonLabel } from '@ionic/react';
import { chevronBackOutline, chevronForwardOutline, caretBackOutline, caretForwardOutline} from 'ionicons/icons'

const Paginator = ({data, pageHandler}) => {
  const [ currentPage, setCurrentPage ] = React.useState();  
  
  let callPage = async (e) => {
    let url = e.target.value;
    if(url !== null){      
      let pageNumber = url.split('page=')[1];      
      await pageHandler(pageNumber);
    }    
  }

  return (
    <>
    <h3 className="ion-text-center" position="stacked">{data.from} - {(data.from + 49) > data.total ? data.total : (data.from + 49)} of {data.total}</h3>
    <IonItem className="ion-text-center">      
      <IonButton shape="round" title="First" color="dark" onClick={callPage} value={data.first_page_url} disabled={data.from > 1 ? false: true } >
        <IonIcon icon={caretBackOutline}></IonIcon>
      </IonButton>
      <IonButton shape="round" title="Previous" color="dark" onClick={callPage} value={data.prev_page_url} disabled={data.from > 1 ? false : true }>
        <IonIcon icon={chevronBackOutline}></IonIcon>
      </IonButton>
      <IonButton shape="round">{data.from%50}</IonButton>      
      <IonButton shape="round" title="Next" color="dark" onClick={callPage} value={data.next_page_url} disabled={data.from < (data.total - 49) ? false: true }>
        <IonIcon icon={chevronForwardOutline}></IonIcon>
      </IonButton>
      <IonButton shape="round" title="Last" color="dark" onClick={callPage} value={data.last_page_url} disabled={data.from < (data.total - 49) ? false: true }>
        <IonIcon icon={caretForwardOutline}></IonIcon>
      </IonButton>
    </IonItem>    
    </>
  )

}


export default Paginator;
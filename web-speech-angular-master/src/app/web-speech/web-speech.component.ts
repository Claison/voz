import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { SpeechRecognizerService } from './shared/services/speech-recognizer.service';

import { SpeechNotification } from './shared/model/speech-notification';
import { SpeechError } from './shared/model/speech-error';
import { ActionContext } from './shared/model/strategy/action-context';

@Component({
  selector: 'wsa-web-speech',
  templateUrl: './web-speech.component.html',
  styleUrls: ['./web-speech.component.css']
})
export class WebSpeechComponent implements OnInit {

  finalTranscript = '';
  recognizing = false;
  notification: string;
  languages: string[] =  ['pt-BR','en-US', 'es-ES'];
  currentLanguage: string;
  actionContext: ActionContext = new ActionContext();

  constructor(private changeDetector: ChangeDetectorRef,
              private speechRecognizer: SpeechRecognizerService) { }

  ngOnInit() {
    this.currentLanguage = this.languages[0];
    this.speechRecognizer.initialize(this.currentLanguage);
    this.initRecognition();
    this.notification = null;
  }

  startButton(event) {
    if (this.recognizing) {
      this.speechRecognizer.stop();
      
      return;
    }

    this.speechRecognizer.start(event.timeStamp);
    this.finalTranscript = '';
  }

  onSelectLanguage(language: string) {
    this.currentLanguage = language;
    this.speechRecognizer.setLanguage(this.currentLanguage);
  }

  private initRecognition() {
    this.speechRecognizer.onStart()
      .subscribe(data => {
        this.recognizing = true;
        this.notification = 'Estou ouvindo...';
        this.detectChanges();
      });

    this.speechRecognizer.onEnd()
      .subscribe(data => {
        this.recognizing = false;
        this.detectChanges();
        this.notification = null;
      });

    this.speechRecognizer.onResult()
      .subscribe((data: SpeechNotification) => {
        const message = data.content.trim();
        if (data.info === 'interim_transcript' && message.length > 0) {
          this.finalTranscript = `${message}`;
          this.actionContext.processMessage(message, this.currentLanguage);
          console.log(message)
          this.detectChanges();
          this.actionContext.runAction(message, this.currentLanguage);
        }
      });

    this.speechRecognizer.onError()
      .subscribe(data => {
        switch (data.error) {
          case SpeechError.BLOCKED:
          case SpeechError.NOT_ALLOWED:
            this.notification = `Não é possível executar a demonstração.
                         Seu navegador não está autorizado a acessar seu microfone. Verifique se o seu navegador tem acesso ao seu microfone e tente novamente.`;
            break;
          case SpeechError.NO_SPEECH:
            this.notification = `Nenhuma fala foi detectada. Por favor, tente novamente.`;
            break;
          case SpeechError.NO_MICROPHONE:
            this.notification = `O microfone não está disponível. Verifique a conexão do seu microfone e tente novamente.`;
            break;
          default:
            this.notification = null;
            break;
        }
        this.recognizing = false;
        this.detectChanges();
      });
  }

  detectChanges() {
    this.changeDetector.detectChanges();
  }
}

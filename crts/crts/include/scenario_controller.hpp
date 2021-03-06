#ifndef _SC_HPP_
#define _SC_HPP_

#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <unistd.h>
#include <sys/time.h>
#include "crts.hpp"
#include "extensible_cognitive_radio.hpp"
#include "interferer.hpp"

void *sc_worker(void *_arg);

struct sc_feedback{
  int node;
  char fb_type;
  void * arg;
};

enum sc_event_types{
  TIMEOUT = 0,
  FEEDBACK
};

class ScenarioController {
public:
  ScenarioController();
  virtual ~ScenarioController();
  virtual void execute();
  virtual void initialize_node_fb();
  void set_sc_timeout_ms(float t);
  void set_node_parameter(int node, char cont_type, void* _arg);
  void receive_feedback(int node, char fb_type, void* _arg);

  float sc_timeout_ms = 1.0;
  int * TCP_nodes;
  struct scenario_parameters sp;
  struct node_parameters np[48];
  struct sc_feedback fb;
  int sc_event;

  //
  void start_sc();
  void stop_sc();

private: 
  // scenario controller threading objects
  pthread_t sc_process;
  pthread_mutex_t sc_mutex;
  pthread_cond_t sc_cond;
  pthread_cond_t sc_execute_sig;
  bool sc_thread_running;
  bool sc_running;
  friend void *sc_worker(void *);

};


// A ScenarioController module must define the two ScenarioController
// object factory functions: createSC() and destroySC() and loader() by
// using this MACRO function.  The exposed symbol is loader() which we get
// with the dynamic shared object loading API functions dlopen(3),
// dlsym(3), and dlclose(3).  The argument derived_class_name is the
// derived class name which must publicly inherit ScenarioController.
// Call this macro outside all code blocks without a tailing semi-colon.
//
#define MAKE_SC_MODULE_FACTORY(derived_class_name)\
    static ScenarioController *createSC(int argc, char** argv)\
    {\
        return new derived_class_name(argc, argv);\
    }\
    static void destroySC(ScenarioController *sc)\
    {\
        delete sc;\
    }\
    extern "C"\
    {\
        void loader(void **c, void **d)\
        {\
            *c = (void *) createSC;\
            *d = (void *) destroySC;\
        }\
    }


#endif // #ifndef _SC_HPP_


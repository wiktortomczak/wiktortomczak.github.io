FROM ubuntu:20.04

# Silence deb preinst and postinst prompts.
ARG DEBIAN_FRONTEND=noninteractive
# Silence tzdata prompts.
RUN echo 'tzdata tzdata/Areas select Europe' | debconf-set-selections
RUN echo 'tzdata tzdata/Zones/Europe select Warsaw' | debconf-set-selections

RUN apt update
RUN apt install -y curl
RUN curl 'https://raw.githubusercontent.com/Interbotix/interbotix_ros_manipulators/main/interbotix_ros_xsarms/install/amd64/xsarm_amd64_install.sh' |  \
    sed  \
      # Silence xsarm_amd64_install.sh prompts.
      -e 's/NONINTERACTIVE=false/NONINTERACTIVE=true/'  \
      -e 's/INSTALL_PERCEPTION=true/INSTALL_PERCEPTION=false/'  \
      -e 's/INSTALL_MATLAB=true/INSTALL_MATLAB=false/'  \
      -e 's/sudo//g' |  \
    grep -v 'upgrade'  \
    > ./xsarm_amd64_install.sh
RUN chmod u+x ./xsarm_amd64_install.sh
RUN ./xsarm_amd64_install.sh -d noetic

# Wrapper script that sources ~/.bashrc before executing the actual command.
# The install script sets up the environment needed for ROS commands in ~/.bashrc.
RUN echo '#!/bin/bash -i' >> ~/source_bashrc_exec.sh
RUN echo 'source ~/.bashrc && exec "$@"' >> ~/source_bashrc_exec.sh
RUN chmod u+x ~/source_bashrc_exec.sh

ENTRYPOINT [  \
  "/root/source_bashrc_exec.sh",  \
  "roslaunch", "interbotix_xsarm_gazebo", "xsarm_gazebo.launch",  \
  "robot_model:=vx300s",  \
  # Mandatory for interacting via python API, per
  # github.com/Interbotix/interbotix_ros_manipulators/tree/main/interbotix_ros_xsarms/examples/python_demos/README.md
  # Some explanation: youtu.be/k3zkgN7TYTE&t=60
  "use_position_controllers:=true",  \
  "dof:=5",  \
  "paused:=false"  \
]

# Other parameters available, all listed here:
# github.com/Interbotix/interbotix_ros_manipulators/blob/main/interbotix_ros_xsarms/interbotix_xsarm_gazebo/launch/xsarm_gazebo.launch

# ROS master TCP port, for interacting from outside Docker.
EXPOSE 11311
